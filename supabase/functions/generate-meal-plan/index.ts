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
    // Ensure these fields exist for the meal detail dialog
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

    // Calculate meal distribution
    const breakfastCal = Math.round(dailyCalories * 0.20);
    const snackCal = Math.round(dailyCalories * 0.10);
    const lunchCal = Math.round(dailyCalories * 0.35);
    const dinnerCal = Math.round(dailyCalories * 0.25);

    const systemPrompt = `Du bist ein deutscher Ernährungsexperte.

Erstelle einen Wochenplan mit einfachen deutschen und europäischen Gerichten.

REGELN:
- Nur einfache Hausmannskost
- Keine exotischen Zutaten
- Keine asiatischen Gerichte
- 7 Tage
- 5 Mahlzeiten pro Tag
- Keine Wiederholungen
- JEDE MAHLZEIT MUSS 3-5 ZUTATEN HABEN mit Menge und ungefährem Preis

Tagesziele:
Kalorien: ${dailyCalories}
Protein: ${dailyProtein}
Carbs: ${dailyCarbs}
Fat: ${dailyFat}

Kalorienverteilung:
Frühstück: ${breakfastCal}
Snack: ${snackCal}
Mittagessen: ${lunchCal}
Snack: ${snackCal}
Abendessen: ${dinnerCal}

WICHTIG: Jede Mahlzeit MUSS folgende Felder haben:
- type: "Frühstück", "Snack", "Mittagessen", "Snack", oder "Abendessen"
- name: Name des Gerichts (z.B. "Rührei mit Speck")
- calories: Genaue Kalorien
- protein: Protein in Gramm
- carbs: Kohlenhydrate in Gramm
- fat: Fett in Gramm
- prepTime: Zubereitungszeit in Minuten (z.B. 15, 20, 30)
- ingredients: Array mit Zutaten [{name, amount, price}]
- instructions: Array mit Zubereitungsschritten als Strings

Antwort NUR als JSON im Format:

{
 "mealPlan":[
   {
     "day":"Montag",
     "meals":[
       {
         "type":"Frühstück",
         "name":"Rührei mit Speck und Toast",
         "calories":420,
         "protein":20,
         "carbs":28,
         "fat":22,
         "prepTime":15,
         "ingredients":[
           {"name":"Eier","amount":"3 Stück","price":0.9},
           {"name":"Speck","amount":"50g","price":1.5},
           {"name":"Brot","amount":"2 Scheiben","price":0.5},
           {"name":"Butter","amount":"10g","price":0.1}
         ],
         "instructions":["Eier in einer Pfanne rühren","Speck knusprig braten","Brot toasten","Alles servieren"]
       },
       {
         "type":"Snack",
         "name":"Apfel mit Erdnussbutter",
         "calories":200,
         "protein":8,
         "carbs":22,
         "fat":10,
         "prepTime":5,
         "ingredients":[
           {"name":"Apfel","amount":"1 Stück","price":0.8},
           {"name":"Erdnussbutter","amount":"1 EL","price":0.4}
         ],
         "instructions":["Apfel waschen","Mit Erdnussbutter servieren"]
       }
     ]
   }
 ]
}`;

    const userPrompt = `Erstelle den kompletten Wochenplan für 7 Tage.

${preferences ?? ""}`;

    console.log("[GENERATE-MEAL-PLAN] Calling OpenAI API...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
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

    // Ensure all meals have ingredients by applying fallback function
    if (mealPlan.mealPlan && Array.isArray(mealPlan.mealPlan)) {
      mealPlan.mealPlan = mealPlan.mealPlan.map((day: any) => ({
        ...day,
        meals: day.meals?.map((meal: any) => generateIngredientsForMeal(meal)) || []
      }));
      console.log("[GENERATE-MEAL-PLAN] Applied ingredient fallback for all meals");
    }

    console.log("[GENERATE-MEAL-PLAN] Success! Returning meal plan with ingredients");

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
