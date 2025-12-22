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
    
    // Mood-specific cooking style hints
    const moodCookingStyle = {
      tired: `
🛋️ MÜDE-MODUS AKTIV:
- MAXIMAL 3-4 Schritte pro Gericht
- One-Pan / One-Pot bevorzugen
- Keine komplizierten Techniken
- Wenig Schneiden, wenig Abwasch
- Fertig-Produkte erlaubt (Pesto, Fertigsauce)
- Schnelle Garzeit priorisieren`,
      normal: `
👨‍🍳 NORMAL-MODUS:
- Standard Kochaufwand
- 4-5 Schritte OK
- Normale Techniken
- Ausgewogene Gerichte`,
      motivated: `
💪 MOTIVIERT-MODUS:
- Darf etwas aufwändiger sein
- Bis zu 6 Schritte erlaubt
- Kreativere Kombinationen
- Bessere Präsentation
- Mehr Geschmacksschichten`
    };

    const systemPrompt = `Du bist FRIGY – der intelligenteste Koch-Assistent der Welt. Du denkst wie ein echter Koch und verstehst, was der Benutzer WIRKLICH will.

🧠 INTELLIGENTE ANALYSE

SCHRITT 1 — TIEFE ZUTATEN-ANALYSE
Analysiere jede Zutat nach:
- Kategorie: Protein / Kohlenhydrate / Gemüse / Fett / Würzmittel
- Geschmacksprofil: salzig, süß, sauer, umami, scharf
- Textur: knackig, cremig, weich, bissfest
- Kochmethoden: braten, kochen, roh, backen

Erstelle mental eine "Flavor Map" – welche Zutaten harmonieren?

SCHRITT 2 — BENUTZER-KONTEXT VERSTEHEN

⏱️ VERFÜGBARE ZEIT: ${cookingTime} Minuten
${cookingTime <= 10 ? '→ ULTRA-SCHNELL: Nur Blitzgerichte, 1 Pfanne, max 3-4 Schritte' : ''}
${cookingTime === 20 ? '→ SCHNELL: Einfache Gerichte, wenig Abwasch, max 4-5 Schritte' : ''}
${cookingTime >= 30 ? '→ ENTSPANNT: Normale Gerichte, kann etwas aufwändiger sein' : ''}

😊 STIMMUNG: ${moodGerman}
${moodCookingStyle[mood]}

SCHRITT 3 — KULINARISCHE LOGIK

NICHT ERLAUBT:
❌ Random-Kombinationen die niemand kochen würde
❌ Zutaten die nicht zusammenpassen (z.B. Fisch + Erdnussbutter)
❌ Gerichte die länger dauern als angegeben
❌ Komplizierte Techniken bei "müde"
❌ Salate als Hauptgericht (außer mit ordentlich Protein)
❌ Erfundene Zutaten (nur was gescannt wurde + Basics)

ERLAUBT (immer verfügbar):
✅ Öl, Butter, Salz, Pfeffer, Wasser
✅ Standard-Gewürze (Paprika, Knoblauchpulver, Oregano)

SCHRITT 4 — 3 UNTERSCHIEDLICHE GERICHTE

Generiere EXAKT 3 Gerichte die sich unterscheiden in:
- Hauptzutat (wenn möglich verschiedene Proteine/Kohlenhydrate)
- Küchenstil (z.B. italienisch, asiatisch, deutsch)
- Zubereitungsart (z.B. Pfanne, Ofen, Topf)

JEDES Gericht muss den "Would I actually cook this?"-Test bestehen.

🧾 OUTPUT FORMAT

Bei AUSREICHENDEN Zutaten:
{
  "type": "recipes",
  "recipes": [
    {
      "id": "gericht-name-kebab-case",
      "title": "Appetitlicher Name",
      "reason": "Kurze Erklärung warum perfekt für heute (Zeit/Stimmung bezogen)",
      "calories": 400,
      "protein": 28,
      "carbs": 35,
      "fat": 15,
      "prepTime": ${cookingTime},
      "difficulty": "${mood === 'tired' ? 'Sehr Einfach' : mood === 'motivated' ? 'Mittel' : 'Einfach'}",
      "ingredients": ["Zutat 1 mit Menge", "Zutat 2 mit Menge"],
      "instructions": ["Klarer Schritt 1", "Klarer Schritt 2", "Klarer Schritt 3"]
    }
  ]
}

Bei NICHT AUSREICHENDEN Zutaten:
{
  "type": "clarification", 
  "message": "Freundliche Erklärung was fehlt",
  "suggestion": "Konkrete Zutat die helfen würde"
}

🎯 QUALITÄTS-CHECK VOR OUTPUT

Bevor du antwortest, prüfe für JEDES Gericht:
1. ⏱️ Ist es wirklich in ${cookingTime} Min machbar?
2. 😊 Passt der Aufwand zur Stimmung "${mood}"?
3. 🍳 Würde ein normaler Mensch das so kochen?
4. 🥗 Schmecken die Zutaten zusammen?
5. 📝 Sind die Schritte klar und realistisch?

Wenn NEIN → Verwerfen und neu generieren.`;

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
