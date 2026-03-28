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

    const highCalorieTarget = dailyCalories >= 3200;

    const systemPrompt = `Du bist ein deutscher Ernährungsexperte.

Erstelle einen Wochenplan mit einfachen deutschen und europäischen Gerichten.

REGELN:
- Nur einfache Hausmannskost
- Keine exotischen Zutaten
- Keine asiatischen Gerichte
- 7 Tage
- Genau 5 Mahlzeiten pro Tag
- Die Reihenfolge im meals-Array muss genau sein: Frühstück, Snack, Mittagessen, Abendessen, Snack
- Keine Wiederholungen innerhalb eines Tages
- JEDE MAHLZEIT MUSS 3-5 ZUTATEN HABEN mit Menge und ungefährem Preis
- Die Summe der 5 Mahlzeiten muss das Tagesziel zuverlässig erreichen; das Ziel soll möglichst genau getroffen werden und darf bei Bedarf leicht überschritten werden, aber nicht deutlich unterschritten werden
- Wenn das Kalorienziel hoch ist, wähle bewusst energiereiche, kaloriendichte Gerichte und größere Portionen statt zu leichter Diätkost
- Nutze bei hohen Kalorienzielen gezielt Kalorienbomben aus alltagstauglichen Lebensmitteln wie Nüsse, Erdnussbutter, Käse, Sahne, Butter, Öl, Reis, Nudeln, Brot, Haferflocken, Vollmilch, Avocado, Kartoffeln und fettreicheres Fleisch
- Vermeide zu viele leichte Salate oder sehr kleine Snacks, wenn dadurch das Tagesziel nicht erreicht wird
- Frühstück, Mittag- und Abendessen dürfen bei hohen Zielen deutlich größer ausfallen; Snacks dürfen ebenfalls energiereich sein
- Bei sehr hohen Zielen ab etwa 3200 kcal pro Tag müssen mindestens 2 Mahlzeiten deutlich kaloriendicht sein und die Tageskalorien dürfen nicht nur zur Hälfte abgedeckt werden

Tagesziele:
Kalorien: ${dailyCalories}
Protein: ${dailyProtein}
Carbs: ${dailyCarbs}
Fat: ${dailyFat}

Kalorienverteilung pro Tag:
Frühstück: ${breakfastCal}
Snack: ${snackCal}
Mittagessen: ${lunchCal}
Abendessen: ${dinnerCal}
Snack: ${snackCal}

WICHTIG: Jede Mahlzeit MUSS folgende Felder haben:
- type: "Frühstück", "Snack", "Mittagessen" oder "Abendessen"
- name: Name des Gerichts
- calories: Genaue Kalorien
- protein: Protein in Gramm
- carbs: Kohlenhydrate in Gramm
- fat: Fett in Gramm
- prepTime: Zubereitungszeit in Minuten
- ingredients: Array mit Zutaten [{name, amount, price}]
- instructions: Array mit Zubereitungsschritten als Strings

Achte darauf, dass die Gerichte realistisch, sättigend und zum Kalorienziel passend sind. Bei hohem Ziel lieber deftige, energiereiche Klassiker als zu leichte Mahlzeiten.

Antworte so, dass jeder Tag vollständig ist und genau 5 Mahlzeiten enthält. Wenn das Tagesziel sehr hoch ist, müssen die Gerichte entsprechend groß und energiereich sein.

Antwort NUR als JSON im Format:

{
 "mealPlan":[
   {
     "day":"Montag",
     "meals":[
       {
         "type":"Frühstück",
         "name":"Rührei mit Speck, Käse und Butterbrot",
         "calories":760,
         "protein":34,
         "carbs":52,
         "fat":44,
         "prepTime":20,
         "ingredients":[
           {"name":"Eier","amount":"4 Stück","price":1.2},
           {"name":"Speck","amount":"80g","price":2.2},
           {"name":"Käse","amount":"60g","price":1.0},
           {"name":"Brot","amount":"4 Scheiben","price":1.0},
           {"name":"Butter","amount":"15g","price":0.2}
         ],
         "instructions":["Eier mit Speck in der Pfanne braten","Käse unterheben","Brot toasten und mit Butter bestreichen","Alles zusammen servieren"]
       },
       {
         "type":"Snack",
         "name":"Banane mit Erdnussbutter und Nüssen",
         "calories":380,
         "protein":14,
         "carbs":36,
         "fat":26,
         "prepTime":5,
         "ingredients":[
           {"name":"Banane","amount":"1 Stück","price":0.6},
           {"name":"Erdnussbutter","amount":"2 EL","price":0.8},
           {"name":"Nüsse","amount":"30g","price":1.2}
         ],
         "instructions":["Banane schälen","Mit Erdnussbutter servieren","Nüsse darüber streuen"]
       },
       {
         "type":"Mittagessen",
         "name":"Nudeln mit Hackfleisch-Sahne-Soße",
         "calories":1330,
         "protein":46,
         "carbs":118,
         "fat":46,
         "prepTime":30,
         "ingredients":[
           {"name":"Nudeln","amount":"180g","price":0.8},
           {"name":"Rinderhack","amount":"250g","price":4.1},
           {"name":"Sahne","amount":"150ml","price":1.2},
           {"name":"Tomatensoße","amount":"200ml","price":0.7},
           {"name":"Parmesan","amount":"30g","price":1.1}
         ],
         "instructions":["Nudeln kochen","Hackfleisch anbraten","Sahne und Tomatensoße einrühren","Mit Parmesan servieren"]
       },
       {
         "type":"Abendessen",
         "name":"Kartoffeln mit Hähnchen und Rahmsoße",
         "calories":950,
         "protein":52,
         "carbs":82,
         "fat":42,
         "prepTime":35,
         "ingredients":[
           {"name":"Kartoffeln","amount":"300g","price":0.9},
           {"name":"Hähnchenbrust","amount":"200g","price":3.4},
           {"name":"Rahmsoße","amount":"120ml","price":0.8},
           {"name":"Butter","amount":"15g","price":0.2},
           {"name":"Gemüse","amount":"150g","price":1.0}
         ],
         "instructions":["Kartoffeln kochen","Hähnchen anbraten","Rahmsoße erwärmen","Alles zusammen anrichten"]
       },
       {
         "type":"Snack",
         "name":"Griechischer Joghurt mit Müsli und Honig",
         "calories":380,
         "protein":18,
         "carbs":48,
         "fat":16,
         "prepTime":5,
         "ingredients":[
           {"name":"Griechischer Joghurt","amount":"250g","price":1.2},
           {"name":"Müsli","amount":"60g","price":0.6},
           {"name":"Honig","amount":"1 EL","price":0.2}
         ],
         "instructions":["Joghurt in eine Schüssel geben","Müsli darüber streuen","Mit Honig verfeinern"]
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
