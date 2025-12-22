import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  ingredients: z.array(z.string().min(1).max(100)).min(1).max(50),
  cookingTime: z.number().optional().default(20),
  mood: z.enum(['tired', 'normal', 'motivated']).optional().default('normal'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { ingredients, cookingTime, mood } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing ingredients:", ingredients, "Time:", cookingTime, "Mood:", mood);

    const moodGerman = mood === 'tired' ? 'müde (minimaler Aufwand)' : mood === 'motivated' ? 'motiviert (gerne mehr Aufwand)' : 'normal';
    
    const systemPrompt = `Du bist FRIGY – ein smarter Koch-Assistent der GENAU 3 realistische Gerichte vorschlägt.

🧱 SCHRITT 1 — ZUTATEN-KLASSIFIZIERUNG

Klassifiziere jede Zutat:
- Protein (Fleisch, Fisch, Eier, Tofu, Käse, Hülsenfrüchte)
- Kohlenhydrate (Pasta, Reis, Kartoffeln, Brot)
- Gemüse
- Fett/Sauce (Öl, Butter, Sahne)
- Optional (Gewürze, Senf, Ketchup)

WICHTIG: Ein kochbares Gericht braucht MINDESTENS:
- 1 Protein ODER 1 Kohlenhydrat
- Plus mindestens 1 weitere Zutat

Wenn NUR Gemüse vorhanden → KEINE Gerichte generieren!

🧱 SCHRITT 2 — ZEIT & STIMMUNG FILTER

Kochzeit: ${cookingTime} Minuten
Stimmung: ${moodGerman}

Zeit-Regeln:
- 10 Min → Ultra-simpel, 1 Pfanne, max 4 Schritte
- 20 Min → Einfaches Kochen
- 30 Min → Normales Kochen

Stimmung filtert NUR Aufwand:
- Müde → Minimaler Aufwand, One-Pan
- Normal → Standard
- Motiviert → Etwas aufwändiger

🧱 SCHRITT 3 — GENERIERE EXAKT 3 GERICHTE

Jedes Gericht MUSS:
- Kulinarisch Sinn machen
- Gescannte Zutaten nutzen
- Sich von den anderen unterscheiden
- In die Zeit passen

🧾 OUTPUT FORMAT

Wenn Zutaten AUSREICHEND:
{
  "type": "recipes",
  "recipes": [
    {
      "id": "gericht-1-kebab-case",
      "title": "Einfacher Name",
      "reason": "1 Satz warum es heute passt",
      "calories": 350,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "prepTime": ${cookingTime},
      "difficulty": "Einfach",
      "ingredients": ["Zutat 1", "Zutat 2"],
      "instructions": ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4"]
    }
  ]
}

Wenn Zutaten NICHT AUSREICHEND:
{
  "type": "clarification",
  "message": "Mit Gurke und Paprika allein kann ich kein Hauptgericht zaubern. Füg noch Eier, Nudeln oder Reis hinzu!",
  "suggestion": "Eier"
}

REGELN:
- Max 4-5 Schritte pro Gericht
- Nur gescannte Zutaten + Öl, Salz, Pfeffer, Wasser
- KEINE Random-Kombinationen
- KEINE Salate als Hauptgericht (außer mit Protein)

🎯 ZIEL: 3 gute Optionen, kein Inspirations-Spam.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gescannte Zutaten: ${ingredients.join(", ")}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen. Bitte warte einen Moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporär nicht verfügbar." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    console.log("AI response:", content);

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Error parsing response:", e);
      result = {
        type: "clarification",
        message: "Ich konnte die Zutaten nicht richtig analysieren. Bitte versuche es noch einmal.",
        suggestion: null
      };
    }

    // Ensure recipes have unique IDs
    if (result.type === "recipes" && result.recipes) {
      result.recipes = result.recipes.map((recipe: any, index: number) => ({
        ...recipe,
        id: recipe.id || `recipe-${Date.now()}-${index}`,
      }));
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-recipes:", error);
    return new Response(
      JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
