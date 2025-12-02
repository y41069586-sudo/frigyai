import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image for ingredients...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying food ingredients from refrigerator images. Analyze the image and list all visible food items. Return ONLY a JSON array of ingredient names in German, like this: [\"Tomaten\", \"Hähnchen\", \"Eier\", \"Joghurt\"]. Be specific and practical - focus on actual cooking ingredients."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this refrigerator image and identify all food ingredients you can see. List them in German."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", content);

    // Parse the JSON array from the response
    let ingredients: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Error parsing ingredients:", e);
      // Fallback: split by commas and clean up
      ingredients = content
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }

    return new Response(
      JSON.stringify({ ingredients }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-ingredients:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
