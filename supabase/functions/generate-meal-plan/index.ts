import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sendError(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({
      error: "Meal plan generation failed",
      message
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

// ================================================================================
// INGREDIENT SCALING HELPERS
// ================================================================================

// Scale ingredient amount with unit preservation
function scaleAmount(amount: string, factor: number): string {
  if (!amount) return amount;

  const match = amount.match(/(\d+)(g|ml|Stück|EL|TL|Zehe)?/);

  if (!match) return amount;

  const value = parseFloat(match[1]);
  const unit = match[2] || "";

  const scaled = Math.round(value * factor);

  return `${scaled}${unit}`;
}

// Scale entire meal plan to match target calories per day
function scaleMealPlan(mealPlan: any[], targetCalories: number): any[] {
  return mealPlan.map((day: any) => {
    let currentCalories = 0;

    day.meals.forEach((meal: any) => {
      currentCalories += meal.calories || 0;
    });

    if (currentCalories === 0) return day;

    const factor = targetCalories / currentCalories;

    console.log(`[SCALE-PLAN] Day: ${day.day}, Current: ${currentCalories}, Target: ${targetCalories}, Factor: ${factor.toFixed(3)}`);

    const scaledMeals = day.meals.map((meal: any) => {
      const scaledIngredients = (meal.ingredients || []).map((ing: any) => {
        return {
          ...ing,
          amount: scaleAmount(ing.amount, factor)
        };
      });

      return {
        ...meal,
        calories: Math.round(meal.calories * factor),
        protein: Math.round(meal.protein * factor),
        carbs: Math.round(meal.carbs * factor),
        fat: Math.round(meal.fat * factor),
        ingredients: scaledIngredients
      };
    });

    return {
      ...day,
      meals: scaledMeals
    };
  });
}

// Validate meal plan structure
function validateMealPlanStructure(mealPlan: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(mealPlan)) {
    errors.push("mealPlan is not an array");
    return { isValid: false, errors };
  }

  if (mealPlan.length !== 7) {
    errors.push(`Expected 7 days, got ${mealPlan.length}`);
  }

  mealPlan.forEach((day: any, dayIndex: number) => {
    if (!Array.isArray(day.meals) || day.meals.length !== 5) {
      errors.push(`Day ${day.day || dayIndex} has ${day.meals?.length || 0} meals, expected 5`);
    }

    day.meals?.forEach((meal: any, mealIndex: number) => {
      if (!meal.name || meal.name.trim() === "") {
        errors.push(`Day ${day.day} Meal ${mealIndex}: Missing name`);
      }
      if (!meal.calories || meal.calories === 0) {
        errors.push(`Day ${day.day} "${meal.name}": calories is 0 or missing`);
      }
      if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
        errors.push(`Day ${day.day} "${meal.name}": Missing ingredients`);
      }
      if (!Array.isArray(meal.instructions) || meal.instructions.length === 0) {
        errors.push(`Day ${day.day} "${meal.name}": Missing instructions`);
      }
    });
  });

  return { isValid: errors.length === 0, errors };
}

// Validate that meal plan meets daily calorie targets (with tolerance)
function validateMealPlanCalories(mealPlan: any[], targetCalories: number, tolerance: number = 0.05): { isValid: boolean; details: any } {
  if (!Array.isArray(mealPlan) || mealPlan.length === 0) {
    return { isValid: false, details: "Empty meal plan" };
  }

  const dailyAnalysis = mealPlan.map((day: any) => {
    const dayCalories = (day.meals || []).reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
    const deviation = Math.abs(dayCalories - targetCalories) / targetCalories;
    return {
      day: day.day,
      totalCalories: dayCalories,
      targetCalories,
      percentage: (dayCalories / targetCalories) * 100,
      deviation: Math.round(deviation * 1000) / 10, // percentage
      meetsTarget: deviation <= tolerance
    };
  });

  // Check if all days meet the target (now with strict ±5% tolerance)
  const daysMeetingTarget = dailyAnalysis.filter(d => d.meetsTarget).length;
  const isValid = daysMeetingTarget === 7; // All 7 days must meet target

  const avgCalories = dailyAnalysis.reduce((sum: any, d: any) => sum + d.totalCalories, 0) / dailyAnalysis.length;
  const avgPercentage = (avgCalories / targetCalories) * 100;
  const avgDeviation = Math.abs(avgCalories - targetCalories) / targetCalories;

  return {
    isValid,
    details: {
      daysMeetingTarget,
      totalDays: dailyAnalysis.length,
      avgCalories: Math.round(avgCalories),
      avgPercentage: Math.round(avgPercentage),
      avgDeviation: Math.round(avgDeviation * 1000) / 10,
      tolerance: Math.round(tolerance * 1000) / 10,
      dailyBreakdown: dailyAnalysis
    }
  };
}

// Generate placeholder ingredients if they're missing
function generateIngredientsForMeal(meal: any): any {
  if (meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
    return meal; // Keep original if they exist
  }

  // Fallback ingredients based on meal type
  const ingredientsByType: Record<string, any[]> = {
    "Frühstück": [
      { name: "Eier", amount: "2 Stück", price: 0.5 },
      { name: "Brot", amount: "2 Scheiben", price: 0.5 },
      { name: "Butter", amount: "10g", price: 0.1 },
      { name: "Käse", amount: "50g", price: 0.8 }
    ],
    "Mittagessen": [
      { name: "Hähnchen", amount: "150g", price: 2.0 },
      { name: "Kartoffeln", amount: "200g", price: 0.5 },
      { name: "Broccoli", amount: "150g", price: 1.0 },
      { name: "Öl", amount: "1 EL", price: 0.2 }
    ],
    "Abendessen": [
      { name: "Rinderhack", amount: "150g", price: 2.5 },
      { name: "Nudeln", amount: "100g", price: 0.5 },
      { name: "Tomaten", amount: "200g", price: 1.0 },
      { name: "Knoblauch", amount: "1 Zehe", price: 0.2 }
    ],
    "Snack": [
      { name: "Apfel", amount: "1 Stück", price: 0.8 },
      { name: "Nüsse", amount: "30g", price: 1.0 },
      { name: "Joghurt", amount: "100g", price: 0.6 }
    ]
  };

  const mealType = meal.type || "Snack";
  const ingredients = ingredientsByType[mealType] || ingredientsByType["Snack"];

  return {
    ...meal,
    ingredients: ingredients,
    instructions: meal.instructions || [],
    prepTime: meal.prepTime || 20
  };
}

serve(async (req) => {
  console.log("[GENERATE-MEAL-PLAN] New request:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check API key
    if (!OPENAI_API_KEY) {
      console.error("[GENERATE-MEAL-PLAN] OPENAI_API_KEY is not set!");
      return sendError("OPENAI_API_KEY is not configured on the server", 500);
    }

    // Parse request body
    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[GENERATE-MEAL-PLAN] Failed to parse JSON:", e);
      return sendError("Invalid request body", 400);
    }

    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, preferences } = body;

    // Validate required fields
    if (!dailyCalories || !dailyProtein || !dailyCarbs || !dailyFat) {
      console.error("[GENERATE-MEAL-PLAN] Missing required fields");
      return sendError("Missing required fields: dailyCalories, dailyProtein, dailyCarbs, dailyFat", 400);
    }

    // ================================================================================
    // STEP 1: STRICT CALORIE PRE-ALLOCATION
    // ================================================================================
    const mealAllocation = {
      breakfast: Math.round(dailyCalories * 0.25),      // 25%
      snack1: Math.round(dailyCalories * 0.10),         // 10%
      lunch: Math.round(dailyCalories * 0.30),          // 30%
      snack2: Math.round(dailyCalories * 0.10),         // 10%
      dinner: Math.round(dailyCalories * 0.25)          // 25%
    };
    
    const totalAllocated = mealAllocation.breakfast + mealAllocation.snack1 + mealAllocation.lunch + mealAllocation.snack2 + mealAllocation.dinner;
    
    console.log("[GENERATE-MEAL-PLAN] CALORIE ALLOCATION (PRE-AI):", {
      target: dailyCalories,
      allocated: totalAllocated,
      breakdown: mealAllocation
    });

    // ================================================================================
    // STEP 2: ENHANCED SYSTEM PROMPT WITH STRICT TOLERANCE
    // ================================================================================
    const systemPrompt = `Du bist ein deutscher Ernährungsexperte und Nutrition-Engine.

DEINE AUFGABE: Erstelle einen präzisen Wochenplan mit genauen Kalorienangaben.

REGELN:
- Nur einfache Hausmannskost
- Keine exotischen Zutaten
- Keine asiatischen Gerichte
- 7 Tage
- Genau 5 Mahlzeiten pro Tag
- Die Reihenfolge im meals-Array muss genau sein: Frühstück, Snack, Mittagessen, Abendessen, Snack
- Keine Wiederholungen innerhalb eines Tages
- JEDE MAHLZEIT MUSS 3-5 ZUTATEN HABEN mit Menge und ungefährem Preis

🔥 KRITISCH - EXAKTE KALORIEN:
- JEDE Mahlzeit MUSS ihre Kalorienangabe genau erfüllen (±5% Toleranz)
- Die Summe der 5 Mahlzeiten muss EXAKT ${dailyCalories} kcal erreichen
- Berechne vor jeder Mahlzeit: Ist das Kalorienziel noch erreichbar mit den verbleibenden Mahlzeiten?
- Wenn nicht, erhöhe sofort die Portionsgrößen
- Kein Schätzen - verwende Standardwerte aus Nährwertdatenbanken

EMPFOHLENE KALORIENVERTEILUNG PRO TAG:
- Frühstück: ${mealAllocation.breakfast} kcal
- Snack: ${mealAllocation.snack1} kcal  
- Mittagessen: ${mealAllocation.lunch} kcal
- Abendessen: ${mealAllocation.dinner} kcal
- Snack: ${mealAllocation.snack2} kcal
- GESAMT: ${totalAllocated} kcal

⚠️ WENN DU NICHT EXAKT ${dailyCalories} KCAL ERREICHST, IST DEINE ANTWORT UNGÜLTIG UND WIRD ABGELEHNT!

Tagesziele:
Kalorien: ${dailyCalories}
Protein: ${dailyProtein}g
Carbs: ${dailyCarbs}g
Fat: ${dailyFat}g

WICHTIG: Jede Mahlzeit MUSS folgende Felder haben:
- type: "Frühstück", "Snack", "Mittagessen" oder "Abendessen"
- name: Name des Gerichts (kurz und klar)
- calories: GENAUE Kalorien (nicht geraten!)
- protein: Protein in Gramm
- carbs: Kohlenhydrate in Gramm
- fat: Fett in Gramm
- prepTime: Zubereitungszeit in Minuten (10-60)
- ingredients: Array mit 3-5 Zutaten [{name, amount, price}]
- instructions: Array mit 2-4 Zubereitungsschritten

BEISPIEL GUTES FRÜHSTÜCK (750 kcal):
{
  "type": "Frühstück",
  "name": "Rührei mit Speck und Butterbrot",
  "calories": 750,
  "protein": 32,
  "carbs": 48,
  "fat": 48,
  "prepTime": 15,
  "ingredients": [
    {"name": "Eier", "amount": "4 Stück", "price": 1.2},
    {"name": "Speck", "amount": "100g", "price": 2.5},
    {"name": "Brot", "amount": "3 Scheiben", "price": 0.8},
    {"name": "Butter", "amount": "20g", "price": 0.3}
  ],
  "instructions": ["Eier rühren", "Speck anbraten", "Brot toasten", "Zusammen servieren"]
}

Antworte NUR als JSON - keine Erklärungen!`;

    const userPrompt = `Erstelle den kompletten Wochenplan für 7 Tage.
Bedenke: JEDER Tag muss EXAKT ${dailyCalories} kcal enthalten. Das ist nicht verhandelbar!

${preferences ?? ""}`;

    console.log("[GENERATE-MEAL-PLAN] Calling OpenAI API with enhanced prompt...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    console.log("[GENERATE-MEAL-PLAN] OpenAI response status:", openaiResponse.status);

    if (!openaiResponse.ok) {
      let errorText = "";
      try {
        const errorBody = await openaiResponse.json();
        errorText = JSON.stringify(errorBody);
      } catch {
        errorText = await openaiResponse.text();
      }
      console.error("[GENERATE-MEAL-PLAN] OpenAI error:", errorText);
      return sendError(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const responseData = await openaiResponse.json();
    const content = responseData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[GENERATE-MEAL-PLAN] No content in OpenAI response");
      return sendError("OpenAI returned empty response");
    }

    // Parse the JSON response
    let mealPlan;
    try {
      mealPlan = JSON.parse(content);
    } catch (e) {
      console.error("[GENERATE-MEAL-PLAN] Failed to parse OpenAI JSON response:", e);
      return sendError("OpenAI response was not valid JSON");
    }

    // ================================================================================
    // STEP 3: VALIDATION & STRUCTURE CHECK (BEFORE SCALING)
    // ================================================================================
    if (!mealPlan.mealPlan || !Array.isArray(mealPlan.mealPlan)) {
      console.error("[GENERATE-MEAL-PLAN] mealPlan.mealPlan is not an array:", typeof mealPlan.mealPlan);
      return sendError(`Invalid meal plan structure. Expected mealPlan array, got ${typeof mealPlan.mealPlan}`);
    }

    const structureValidation = validateMealPlanStructure(mealPlan.mealPlan);
    if (!structureValidation.isValid) {
      console.error("[GENERATE-MEAL-PLAN] Structure validation failed:", structureValidation.errors);
      return sendError(`Invalid meal plan structure: ${structureValidation.errors.join(", ")}`);
    }

    // Ensure all meals have ingredients BEFORE scaling
    console.log("[GENERATE-MEAL-PLAN] Ensuring all meals have ingredients...");
    mealPlan.mealPlan = mealPlan.mealPlan.map((day: any) => ({
      ...day,
      meals: day.meals?.map((meal: any) => generateIngredientsForMeal(meal)) || []
    }));

    // ================================================================================
    // STEP 4: IMMEDIATE SCALING AFTER AI RESPONSE
    // ================================================================================
    console.log(`[GENERATE-MEAL-PLAN] Scaling meal plan from AI to exact calorie target (${dailyCalories} kcal/day)...`);
    mealPlan.mealPlan = scaleMealPlan(mealPlan.mealPlan, dailyCalories);
    console.log("[GENERATE-MEAL-PLAN] Scaling complete");

    // ================================================================================
    // STEP 5: FINAL CALORIE VALIDATION
    // ================================================================================
    console.log("[GENERATE-MEAL-PLAN] Starting final calorie validation...");
    const finalValidation = validateMealPlanCalories(mealPlan.mealPlan, dailyCalories, 0.05);

    console.log("[GENERATE-MEAL-PLAN] Final validation result:", finalValidation.details);

    if (!finalValidation.isValid) {
      console.error("[GENERATE-MEAL-PLAN] Final validation failed:", finalValidation.details);
      return sendError(
        `Final validation failed. Average calories: ${finalValidation.details.avgCalories} kcal (deviation: ${finalValidation.details.avgDeviation}%). Required: ±5%.`,
        400
      );
    }

    console.log("[GENERATE-MEAL-PLAN] ✅ SUCCESS! Meal plan meets all requirements");
    console.log("[GENERATE-MEAL-PLAN] Summary:", {
      target: dailyCalories,
      average: finalValidation.details.avgCalories,
      daysMeeting: finalValidation.details.daysMeetingTarget,
      deviation: finalValidation.details.avgDeviation + "%"
    });

    return new Response(JSON.stringify(mealPlan), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[GENERATE-MEAL-PLAN] Unexpected error:", errorMsg);
    return sendError(errorMsg);
  }
});
