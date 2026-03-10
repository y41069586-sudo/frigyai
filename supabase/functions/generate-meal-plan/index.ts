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

    console.log("[GENERATE-MEAL-PLAN] Success! Returning meal plan");

    return new Response(content, {
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
