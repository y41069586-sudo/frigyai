import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
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
    // Authenticate user
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
    
    // Validate input
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

    // Build the decision prompt
    const systemPrompt = `Du bist FRIGY – ein smarter, entscheidungsfreudiger Koch-Assistent.

🧱 SCHRITT 1 — ZUTATEN-ANALYSE

Klassifiziere jede Zutat:
- Protein (Fleisch, Fisch, Eier, Tofu, Hülsenfrüchte, Käse)
- Kohlenhydrate (Pasta, Reis, Kartoffeln, Brot, Tortillas)
- Gemüse
- Fett/Sauce (Öl, Butter, Sahne, Saucen)
- Gewürze/Optional (Gewürze, Kräuter, Senf, etc.)

Ein kochbares Gericht MUSS enthalten:
- Mindestens 1 Protein ODER 1 Kohlenhydrat
- UND mindestens 1 unterstützende Zutat

❌ Wenn NUR Gemüse vorhanden (z.B. Gurke + Paprika):
→ Das ist KEIN gültiges Hauptgericht
→ Gib eine hilfreiche Nachricht zurück (siehe unten)

🧱 SCHRITT 2 — ZEIT & STIMMUNG

Verfügbare Kochzeit: ${cookingTime} Minuten
Stimmung: ${mood === 'tired' ? 'müde' : mood === 'motivated' ? 'motiviert' : 'normal'}

Zeit-Regeln:
- 10 Min → kein Ofen, max 3-4 Schritte
- 20 Min → einfache Herd-Gerichte
- 30+ Min → normales Kochen

Stimmung-Regeln:
- Müde → minimal Aufwand, One-Pan, kein Multitasking
- Normal → einfach aber komplett
- Motiviert → etwas aufwändiger, aber realistisch

🧠 SCHRITT 3 — ENTSCHEIDUNG

Du MUSST EINE einzige beste Rezept-Empfehlung treffen.
- KEINE Liste von Rezepten
- KEINE Auswahlmöglichkeiten
- DU entscheidest für den Nutzer

Wähle das Rezept das:
1. Die meisten gescannten Zutaten nutzt
2. Am wenigsten Aufwand erfordert
3. Am besten zu Zeit + Stimmung passt

🍽️ SCHRITT 4 — VALIDIERUNG

Prüfe vor der Ausgabe:
- Würde das eine normale Person kochen?
- Macht es kulinarisch Sinn?
- Hat es eine klare Hauptkomponente?

🧾 OUTPUT FORMAT

Wenn Zutaten AUSREICHEND sind, gib JSON zurück:
{
  "type": "recipe",
  "recipe": {
    "id": "unique-id",
    "title": "Einfacher deutscher Name",
    "reason": "Kurzer Satz warum dieses Gericht",
    "calories": 350,
    "protein": 25,
    "carbs": 30,
    "fat": 12,
    "prepTime": ${cookingTime},
    "difficulty": "Einfach",
    "ingredients": ["Zutat 1", "Zutat 2"],
    "instructions": ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4", "Schritt 5"]
  }
}

Wenn Zutaten NICHT AUSREICHEND sind:
{
  "type": "clarification",
  "message": "Mit dem was du hast, kann ich noch kein vollständiges Gericht vorschlagen. Wenn du noch Eier, Nudeln oder Reis hinzufügst, kann ich dir etwas Leckeres empfehlen.",
  "suggestion": "Eier"
}

REGELN für instructions:
- Max 5 Schritte
- Kurz und klar
- Kein Kochblog-Stil

Erlaubte Basis-Zutaten (immer verfügbar):
- Öl, Salz, Pfeffer, Wasser

🎯 DEIN ZIEL: Der Nutzer soll aufhören zu überlegen und anfangen zu kochen.`;

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

    // Parse the JSON response
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
      // Fallback: treat as clarification
      result = {
        type: "clarification",
        message: "Ich konnte die Zutaten nicht richtig analysieren. Bitte versuche es noch einmal.",
        suggestion: null
      };
    }

    // Ensure recipe has unique ID
    if (result.type === "recipe" && result.recipe) {
      result.recipe.id = result.recipe.id || `recipe-${Date.now()}`;
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
