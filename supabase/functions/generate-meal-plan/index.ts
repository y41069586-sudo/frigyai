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

// Generate placeholder ingredients if missing
function generateIngredientsForMeal(meal: any): any {
  if (meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
    return meal;
  }

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

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return sendError("OPENAI_API_KEY is not configured", 500);
    }

    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch (e) {
      return sendError("Invalid request body", 400);
    }

    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, preferences, mealsPerDay = 5 } = body;

    if (!dailyCalories || !dailyProtein || !dailyCarbs || !dailyFat) {
      return sendError("Missing required fields", 400);
    }

    const validMeals = Math.max(3, Math.min(6, mealsPerDay));
    const minProteinPerMeal = Math.round(dailyProtein / validMeals);

    console.log(`[GENERATE-MEAL-PLAN] Meals: ${validMeals}, Calories: ${dailyCalories}, Protein: ${dailyProtein}g`);

    // ================================================================================
    // DYNAMIC CALORIE ALLOCATION
    // ================================================================================

    const generateMealAllocation = (mealsCount: number, totalCals: number): Record<string, number> => {
      const allocation: Record<string, number> = {};

      if (mealsCount === 3) {
        allocation.breakfast = Math.round(totalCals * 0.30);
        allocation.lunch = Math.round(totalCals * 0.40);
        allocation.dinner = Math.round(totalCals * 0.30);
      } else if (mealsCount === 4) {
        allocation.breakfast = Math.round(totalCals * 0.25);
        allocation.lunch = Math.round(totalCals * 0.35);
        allocation.snack1 = Math.round(totalCals * 0.10);
        allocation.dinner = Math.round(totalCals * 0.30);
      } else if (mealsCount === 5) {
        allocation.breakfast = Math.round(totalCals * 0.25);
        allocation.snack1 = Math.round(totalCals * 0.10);
        allocation.lunch = Math.round(totalCals * 0.30);
        allocation.snack2 = Math.round(totalCals * 0.10);
        allocation.dinner = Math.round(totalCals * 0.25);
      } else if (mealsCount === 6) {
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

    // ================================================================================
    // OPTIMIZED FAST PROMPT
    // ================================================================================

    const allocationText = Object.entries(mealAllocation)
      .map(([type, cals]) => `- ${type}: ${cals} kcal`)
      .join('\n');

    const systemPrompt = `Du bist ein Nutrition Planner. Erstelle EXAKT einen Wochenplan mit diesen Kalorien pro Tag:

${allocationText}
GESAMT: ${dailyCalories} kcal

REGELN:
- 7 Tage, ${validMeals} Mahlzeiten pro Tag
- Kein Protein unter ${minProteinPerMeal}g pro Mahlzeit
- Einfache deutsche Küche
- 3-5 Zutaten pro Mahlzeit
- JSON Format nur

Format:
{
  "mealPlan": [
    {
      "day": "Montag",
      "meals": [
        {
          "type": "Frühstück",
          "name": "...",
          "calories": ${Math.round(mealAllocation.breakfast || dailyCalories / validMeals)},
          "protein": ${minProteinPerMeal},
          "carbs": ${Math.round(dailyCarbs / validMeals)},
          "fat": ${Math.round(dailyFat / validMeals)},
          "prepTime": 15,
          "ingredients": [{"name": "...", "amount": "...", "price": 0.5}],
          "instructions": ["..."]
        }
      ]
    }
  ]
}`;

    const userPrompt = `Wochenplan für ${validMeals} Mahlzeiten, ${dailyCalories} kcal/Tag. ${preferences || ""}`;

    console.log("[GENERATE-MEAL-PLAN] Calling OpenAI...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 3500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[GENERATE-MEAL-PLAN] OpenAI error:", errorText);
      return sendError(`OpenAI error: ${errorText}`);
    }

    const responseData = await openaiResponse.json();
    const content = responseData.choices?.[0]?.message?.content;

    if (!content) {
      return sendError("Empty OpenAI response");
    }

    let mealPlan;
    try {
      mealPlan = JSON.parse(content);
    } catch (e) {
      return sendError("Invalid JSON from OpenAI");
    }

    if (!mealPlan.mealPlan || !Array.isArray(mealPlan.mealPlan) || mealPlan.mealPlan.length !== 7) {
      return sendError("Invalid meal plan structure");
    }

    // Add missing ingredients
    mealPlan.mealPlan = mealPlan.mealPlan.map((day: any) => ({
      ...day,
      meals: day.meals?.map((meal: any) => generateIngredientsForMeal(meal)) || []
    }));

    // Scale to exact calories
    mealPlan.mealPlan = scaleMealPlan(mealPlan.mealPlan, dailyCalories);

    console.log("[GENERATE-MEAL-PLAN] ✅ SUCCESS");

    return new Response(JSON.stringify(mealPlan), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[GENERATE-MEAL-PLAN] Error:", errorMsg);
    return sendError(errorMsg);
  }
});
