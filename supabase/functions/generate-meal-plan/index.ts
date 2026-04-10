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

// Validate individual meals meet per-meal requirements
function validateMealPerformance(day: any, mealAllocation: Record<string, number>, minProteinPerMeal: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(day.meals)) {
    errors.push(`Day ${day.day} has no meals array`);
    return { isValid: false, errors };
  }

  day.meals.forEach((meal: any, index: number) => {
    // Check calorie tolerance (±50 kcal from allocated amount)
    const mealType = meal.type || Object.keys(mealAllocation)[index] || "unknown";
    const allocatedCals = mealAllocation[mealType] || 0;
    const mealCals = meal.calories || 0;
    const calorieDeviation = Math.abs(mealCals - allocatedCals);

    if (calorieDeviation > 50) {
      errors.push(
        `Day ${day.day} "${meal.name}": Calories ${mealCals} deviate by ${calorieDeviation}kcal from allocated ${allocatedCals}kcal`
      );
    }

    // Check protein minimum
    if (meal.protein < minProteinPerMeal) {
      errors.push(
        `Day ${day.day} "${meal.name}": Protein ${meal.protein}g is below minimum ${minProteinPerMeal}g`
      );
    }
  });

  return { isValid: errors.length === 0, errors };
}

// Validate meal plan structure
function validateMealPlanStructure(mealPlan: any[], expectedMealsPerDay: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(mealPlan)) {
    errors.push("mealPlan is not an array");
    return { isValid: false, errors };
  }

  if (mealPlan.length !== 7) {
    errors.push(`Expected 7 days, got ${mealPlan.length}`);
  }

  mealPlan.forEach((day: any, dayIndex: number) => {
    if (!Array.isArray(day.meals) || day.meals.length !== expectedMealsPerDay) {
      errors.push(`Day ${day.day || dayIndex} has ${day.meals?.length || 0} meals, expected ${expectedMealsPerDay}`);
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

    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, preferences, mealsPerDay = 5 } = body;

    // Validate required fields
    if (!dailyCalories || !dailyProtein || !dailyCarbs || !dailyFat) {
      console.error("[GENERATE-MEAL-PLAN] Missing required fields");
      return sendError("Missing required fields: dailyCalories, dailyProtein, dailyCarbs, dailyFat", 400);
    }

    // Validate meals per day
    const validMeals = Math.max(3, Math.min(6, mealsPerDay));
    console.log(`[GENERATE-MEAL-PLAN] Meals per day: ${validMeals}`);

    // ================================================================================
    // STEP 1: DYNAMIC CALORIE PRE-ALLOCATION
    // ================================================================================

    // Generate dynamic meal allocation based on meals per day
    const generateMealAllocation = (mealsCount: number, totalCals: number): Record<string, number> => {
      const allocation: Record<string, number> = {};

      if (mealsCount === 3) {
        // Breakfast 30%, Lunch 40%, Dinner 30%
        allocation.breakfast = Math.round(totalCals * 0.30);
        allocation.lunch = Math.round(totalCals * 0.40);
        allocation.dinner = Math.round(totalCals * 0.30);
      } else if (mealsCount === 4) {
        // Breakfast 25%, Lunch 35%, Snack 10%, Dinner 30%
        allocation.breakfast = Math.round(totalCals * 0.25);
        allocation.lunch = Math.round(totalCals * 0.35);
        allocation.snack1 = Math.round(totalCals * 0.10);
        allocation.dinner = Math.round(totalCals * 0.30);
      } else if (mealsCount === 5) {
        // Standard: 25%, 10%, 30%, 10%, 25%
        allocation.breakfast = Math.round(totalCals * 0.25);
        allocation.snack1 = Math.round(totalCals * 0.10);
        allocation.lunch = Math.round(totalCals * 0.30);
        allocation.snack2 = Math.round(totalCals * 0.10);
        allocation.dinner = Math.round(totalCals * 0.25);
      } else if (mealsCount === 6) {
        // 6 meals: 20%, 8%, 25%, 10%, 22%, 15%
        allocation.breakfast = Math.round(totalCals * 0.20);
        allocation.snack1 = Math.round(totalCals * 0.08);
        allocation.lunch = Math.round(totalCals * 0.25);
        allocation.snack2 = Math.round(totalCals * 0.10);
        allocation.dinner = Math.round(totalCals * 0.22);
        allocation.snack3 = Math.round(totalCals * 0.15);
      }

      return allocation;
    };

    const mealAllocation = generateMealAllocation(validMeals, dailyCalories);
    const totalAllocated = Object.values(mealAllocation).reduce((sum, val) => sum + val, 0);

    console.log("[GENERATE-MEAL-PLAN] CALORIE ALLOCATION (PRE-AI):", {
      mealsPerDay: validMeals,
      target: dailyCalories,
      allocated: totalAllocated,
      breakdown: mealAllocation
    });

    // ================================================================================
    // STEP 2: DYNAMIC SYSTEM PROMPT WITH STRICT PER-MEAL VALIDATION
    // ================================================================================

    // Build the meal allocation text for the prompt
    const allocationText = Object.entries(mealAllocation)
      .map(([type, cals]) => {
        const proteinPerMeal = Math.round(dailyProtein / validMeals);
        return `- ${type}: EXAKT ${cals} kcal, MINDESTENS ${proteinPerMeal}g Protein`;
      })
      .join('\n');

    const minProteinPerMeal = Math.round(dailyProtein / validMeals);

    const systemPrompt = `Du bist ein deutscher Ernährungsexperte und Nutrition-Engine.

DEINE AUFGABE: Erstelle einen präzisen Wochenplan mit EXAKTEN Kalorienangaben für ${validMeals} Mahlzeiten pro Tag.

KRITISCHE ANFORDERUNGEN:
✓ 7 Tage
✓ Genau ${validMeals} Mahlzeiten pro Tag
✓ Jede Mahlzeit MUSS 3-5 Zutaten haben
✓ Nur einfache Hausmannskost (keine Exoten, keine Asian-Gerichte)
✓ Keine Wiederholungen innerhalb eines Tages

🔥 KALORIENRICHTLINIEN (NICHT VERHANDELBAR):

JEDE MAHLZEIT MUSS:
- Die EXAKTEN Kalorien erfüllen (siehe unten)
- MINDESTENS ${minProteinPerMeal}g Protein haben
- Mahlzeiten-Liste in korrekter Reihenfolge

TÄGLICHE AUFTEILUNG (EXAKT):
${allocationText}
TAGESGESAMT: EXAKT ${dailyCalories} kcal (±0 kcal Toleranz!)

BEISPIEL: Eine 300-kcal Mahlzeit muss EXAKT 300 kcal sein (nicht 280, nicht 320)!

BERECHNUNG:
- Pro Mahlzeit berechnen: Wie viele Kalorien noch verfügbar?
- Portionen so anpassen, dass die EXAKTE Zahl erreicht wird
- NIEMALS schätzen - verwende Standard-Nährwertdaten

JSON STRUKTUR (MUSS exakt eingehalten werden):

{
  "mealPlan": [
    {
      "day": "Montag",
      "meals": [
        {
          "type": "Frühstück",
          "name": "Eierspeise mit Toast",
          "calories": ${mealAllocation.breakfast || Math.round(dailyCalories / validMeals)},
          "protein": ${minProteinPerMeal},
          "carbs": ${Math.round(dailyCarbs / validMeals)},
          "fat": ${Math.round(dailyFat / validMeals)},
          "prepTime": 15,
          "ingredients": [
            {"name": "Eier", "amount": "3 Stück", "price": 0.9},
            {"name": "Vollkornbrot", "amount": "2 Scheiben", "price": 0.6},
            {"name": "Butter", "amount": "10g", "price": 0.2},
            {"name": "Salz & Pfeffer", "amount": "nach Geschmack", "price": 0.1}
          ],
          "instructions": [
            "Eier schlagen und rühren",
            "Brot toasten",
            "Eierspeise auf Toast anrichten"
          ]
        },
        ...weitere 4 Mahlzeiten
      ]
    },
    ...weitere 6 Tage
  ]
}

⚠️ ABSOLUT KRITISCH:
1. Jede Mahlzeit MUSS EXAKT ihre Calorie-Zuweisung erfüllen
2. Jede Mahlzeit MUSS MINDESTENS ${minProteinPerMeal}g Protein haben
3. Gesamtkalorien pro Tag MUSS EXAKT ${dailyCalories} sein
4. Wenn NICHT erfüllt → ANTWORT WIRD ABGELEHNT UND REGENERIERT!

Antworte NUR als JSON - keine Erklärungen!`;

    const userPrompt = `Erstelle den kompletten Wochenplan für 7 Tage.
Bedenke: JEDER Tag muss EXAKT ${dailyCalories} kcal enthalten. Das ist nicht verhandelbar!

${preferences ?? ""}`;

    // ================================================================================
    // STEP 3: GENERATE WITH RETRY LOGIC (UP TO 3 ATTEMPTS)
    // ================================================================================

    const maxRetries = 3;
    let mealPlan: any = null;
    let lastValidationErrors: string[] = [];
    const minProteinPerMeal = Math.round(dailyProtein / validMeals);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[GENERATE-MEAL-PLAN] Generation attempt ${attempt}/${maxRetries}...`);

      let currentUserPrompt = userPrompt;

      // On retry, ask AI to fix the issues
      if (attempt > 1 && lastValidationErrors.length > 0) {
        currentUserPrompt = `${userPrompt}

FEHLER AUS VERSUCH ${attempt - 1}:
${lastValidationErrors.slice(0, 3).join('\n')}

KORRIGIERE diese Fehler:
- Erhöhe Portionsgrößen falls nötig
- JEDE Mahlzeit MUSS ≥${minProteinPerMeal}g Protein haben
- JEDE Mahlzeit MUSS ±50 kcal der Zuweisung entsprechen
- Gesamtkalorien pro Tag MUSS ±50 kcal von ${dailyCalories} sein`;
      }

      console.log(`[GENERATE-MEAL-PLAN] Calling OpenAI API (attempt ${attempt})...`);

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: currentUserPrompt }
          ]
        })
      });

      if (!openaiResponse.ok) {
        let errorText = "";
        try {
          const errorBody = await openaiResponse.json();
          errorText = JSON.stringify(errorBody);
        } catch {
          errorText = await openaiResponse.text();
        }
        console.error(`[GENERATE-MEAL-PLAN] OpenAI error (attempt ${attempt}):`, errorText);
        if (attempt === maxRetries) {
          return sendError(`OpenAI API error after ${maxRetries} attempts: ${errorText}`);
        }
        continue;
      }

      const responseData = await openaiResponse.json();
      const content = responseData.choices?.[0]?.message?.content;

      if (!content) {
        console.error(`[GENERATE-MEAL-PLAN] No content in response (attempt ${attempt})`);
        if (attempt === maxRetries) {
          return sendError("OpenAI returned empty response");
        }
        continue;
      }

      // Parse JSON
      try {
        mealPlan = JSON.parse(content);
      } catch (e) {
        console.error(`[GENERATE-MEAL-PLAN] JSON parse failed (attempt ${attempt}):`, e);
        if (attempt === maxRetries) {
          return sendError("OpenAI response was not valid JSON");
        }
        continue;
      }

      // Validate structure
      if (!mealPlan.mealPlan || !Array.isArray(mealPlan.mealPlan)) {
        console.error(`[GENERATE-MEAL-PLAN] Invalid structure (attempt ${attempt})`);
        if (attempt === maxRetries) {
          return sendError(`Invalid meal plan structure. Expected mealPlan array`);
        }
        continue;
      }

      const structureValidation = validateMealPlanStructure(mealPlan.mealPlan, validMeals);
      if (!structureValidation.isValid) {
        console.error(`[GENERATE-MEAL-PLAN] Structure validation failed (attempt ${attempt}):`, structureValidation.errors);
        lastValidationErrors = structureValidation.errors;
        if (attempt === maxRetries) {
          return sendError(`Invalid meal plan structure: ${structureValidation.errors.join(", ")}`);
        }
        continue;
      }

      // Ensure all meals have ingredients
      mealPlan.mealPlan = mealPlan.mealPlan.map((day: any) => ({
        ...day,
        meals: day.meals?.map((meal: any) => generateIngredientsForMeal(meal)) || []
      }));

      // Scale to target calories
      console.log(`[GENERATE-MEAL-PLAN] Scaling to ${dailyCalories} kcal (attempt ${attempt})...`);
      mealPlan.mealPlan = scaleMealPlan(mealPlan.mealPlan, dailyCalories);

      // Validate calories and protein
      const finalValidation = validateMealPlanCalories(mealPlan.mealPlan, dailyCalories, 0.05);

      if (!finalValidation.isValid) {
        console.warn(`[GENERATE-MEAL-PLAN] Calorie validation failed (attempt ${attempt}):`, finalValidation.details);
        lastValidationErrors = [`Calories: ${finalValidation.details.avgCalories}/${dailyCalories} (${finalValidation.details.avgDeviation}% deviation)`];
        if (attempt === maxRetries) {
          return sendError(
            `Validation failed after ${maxRetries} attempts. Avg calories: ${finalValidation.details.avgCalories} kcal (deviation: ${finalValidation.details.avgDeviation}%).`
          );
        }
        continue;
      }

      // Validate per-meal requirements
      let perMealErrors: string[] = [];
      for (const day of mealPlan.mealPlan) {
        const dayValidation = validateMealPerformance(day, mealAllocation, minProteinPerMeal);
        if (!dayValidation.isValid) {
          perMealErrors.push(...dayValidation.errors);
        }
      }

      if (perMealErrors.length > 0) {
        console.warn(`[GENERATE-MEAL-PLAN] Per-meal validation failed (attempt ${attempt}):`, perMealErrors);
        lastValidationErrors = perMealErrors;
        if (attempt === maxRetries) {
          return sendError(`Per-meal validation failed after ${maxRetries} attempts: ${perMealErrors.slice(0, 3).join('; ')}`);
        }
        continue;
      }

      // SUCCESS!
      console.log("[GENERATE-MEAL-PLAN] ✅ SUCCESS! Meal plan meets all requirements");
      console.log("[GENERATE-MEAL-PLAN] Summary:", {
        attempt,
        mealsPerDay: validMeals,
        targetCalories: dailyCalories,
        avgCalories: finalValidation.details.avgCalories,
        daysMeeting: finalValidation.details.daysMeetingTarget,
        deviation: finalValidation.details.avgDeviation + "%"
      });

      return new Response(JSON.stringify(mealPlan), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // If we reach here, all retries failed
    return sendError(`Failed to generate valid meal plan after ${maxRetries} attempts`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[GENERATE-MEAL-PLAN] Unexpected error:", errorMsg);
    return sendError(errorMsg);
  }
});
