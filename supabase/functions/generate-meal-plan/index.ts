import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('[GENERATE-MEAL-PLAN] Request received, method:', req.method);

    // Check if API key is set
    if (!OPENAI_API_KEY) {
      console.error('[GENERATE-MEAL-PLAN] OPENAI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "OPENAI_API_KEY is not configured"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    console.log('[GENERATE-MEAL-PLAN] Parsing request body...');
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[GENERATE-MEAL-PLAN] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: String(parseError)
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    console.log('[GENERATE-MEAL-PLAN] Body parsed successfully:', { dailyCalories: body.dailyCalories, dailyProtein: body.dailyProtein });

    const {
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
      preferences
    } = body;

    // Validate required fields
    if (!dailyCalories || !dailyProtein || !dailyCarbs || !dailyFat) {
      console.error('[GENERATE-MEAL-PLAN] Missing required fields:', { dailyCalories, dailyProtein, dailyCarbs, dailyFat });
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          message: "dailyCalories, dailyProtein, dailyCarbs, and dailyFat are required"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    console.log('[GENERATE-MEAL-PLAN] Calculating calorie distribution...');
    // Calculate calorie distribution
    const breakfastCal = Math.round(dailyCalories * 0.20);
    const snackCal = Math.round(dailyCalories * 0.10);
    const lunchCal = Math.round(dailyCalories * 0.35);
    const dinnerCal = Math.round(dailyCalories * 0.25);
    console.log('[GENERATE-MEAL-PLAN] Distribution:', { breakfastCal, snackCal, lunchCal, dinnerCal });

    const systemPrompt = `
Du bist ein deutscher Ernährungsexperte.

Erstelle einen Wochenplan mit einfachen deutschen und europäischen Gerichten.

REGELN:
- Nur einfache Hausmannskost
- Keine exotischen Zutaten
- Keine asiatischen Gerichte
- 7 Tage
- 5 Mahlzeiten pro Tag
- Keine Wiederholungen

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

Antwort NUR als JSON im Format:

{
 "mealPlan":[
   {
     "day":"Montag",
     "meals":[]
   }
 ]
}
`;

    const userPrompt = `
Erstelle den kompletten Wochenplan für 7 Tage.

${preferences ?? ""}
`;

    console.log('[GENERATE-MEAL-PLAN] Prompts created, calling OpenAI API...');
    console.log('[GENERATE-MEAL-PLAN] System prompt length:', systemPrompt.length);
    console.log('[GENERATE-MEAL-PLAN] User prompt length:', userPrompt.length);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {

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
      }),

    });

    console.log('[GENERATE-MEAL-PLAN] OpenAI response received, status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      console.error('[GENERATE-MEAL-PLAN] OpenAI error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    console.log('[GENERATE-MEAL-PLAN] Parsing OpenAI response...');
    const data = await response.json();
    console.log('[GENERATE-MEAL-PLAN] Response parsed');

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[GENERATE-MEAL-PLAN] No content in response:', JSON.stringify(data));
      throw new Error('No content in OpenAI response');
    }

    console.log('[GENERATE-MEAL-PLAN] Content extracted, length:', content.length);
    console.log('[GENERATE-MEAL-PLAN] Successfully generated meal plan, returning response');

    return new Response(content, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[GENERATE-MEAL-PLAN] Catch block error:', errorMessage);
    console.error('[GENERATE-MEAL-PLAN] Full error:', error);

    return new Response(
      JSON.stringify({
        error: "Meal plan generation failed",
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  }

});
