import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 🔥 SCALE FUNCTIONS
function scaleAmount(amount, factor) {
  if (!amount) return amount;

  const match = amount.match(/(\d+)(g|ml|Stück)?/);

  if (!match) return amount;

  const value = parseFloat(match[1]);
  const unit = match[2] || "";

  const scaled = Math.round(value * factor);

  return `${scaled}${unit}`;
}

function scaleMealPlan(mealPlan, targetCalories) {
  return mealPlan.map((day) => {
    let currentCalories = 0;

    day.meals.forEach((meal) => {
      currentCalories += meal.calories || 0;
    });

    if (currentCalories === 0) return day;

    const factor = targetCalories / currentCalories;

    const scaledMeals = day.meals.map((meal) => {
      const scaledIngredients = (meal.ingredients || []).map((ing) => ({
        ...ing,
        amount: scaleAmount(ing.amount, factor),
      }));

      return {
        ...meal,
        calories: Math.round(meal.calories * factor),
        protein: Math.round(meal.protein * factor),
        carbs: Math.round(meal.carbs * factor),
        fat: Math.round(meal.fat * factor),
        ingredients: scaledIngredients,
      };
    });

    return {
      ...day,
      meals: scaledMeals,
    };
  });
}

// 🛒 SHOPPING LIST
function generateShoppingList(mealPlan) {
  const items = {};

  mealPlan.forEach((day) => {
    day.meals.forEach((meal) => {
      (meal.ingredients || []).forEach((ing) => {
        const key = ing.name;

        if (!items[key]) {
          items[key] = {
            name: ing.name,
            amount: ing.amount,
            price: ing.price,
          };
        }
      });
    });
  });

  return Object.values(items);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const systemPrompt = `
Du bist ein deutscher Ernährungsexperte.

Erstelle einen Wochenplan mit einfachen deutschen Gerichten.

REGELN:
- 7 Tage
- 5 Mahlzeiten pro Tag
- Nur einfache Hausmannskost
- Keine exotischen Zutaten

Jede Mahlzeit MUSS enthalten:
name, calories, protein, carbs, fat, prepTime, ingredients, instructions

ingredients MUSS enthalten:
name, amount, price

Antwort NUR als JSON:

{
 "mealPlan":[
  {
   "day":"Montag",
   "meals":[]
  }
 ]
}`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Erstelle einen Wochenplan." },
          ],
        }),
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let parsed = JSON.parse(content);

    // 🔥 FIX: Kalorien skalieren
    parsed.mealPlan = scaleMealPlan(parsed.mealPlan, body.dailyCalories);

    // 🛒 Einkaufsliste erstellen
    const shoppingList = generateShoppingList(parsed.mealPlan);

    return new Response(
      JSON.stringify({
        mealPlan: parsed.mealPlan,
        shoppingList,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
