import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Auth required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const parseResult = requestSchema.safeParse(await req.json());
    if (!parseResult.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { ingredients, cookingTime, mood } = parseResult.data;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    console.log("[GENERATE-RECIPES] Ingredients:", ingredients, "Time:", cookingTime, "Mood:", mood);

    const moodHint = mood === 'tired' 
      ? 'MÜDE - Minimaler Aufwand, One-Pot-Gerichte, maximal 4 Schritte, keine komplizierten Techniken' 
      : mood === 'motivated' 
        ? 'MOTIVIERT - Kann aufwändiger sein, mehrere Komponenten, bis zu 6-7 Schritte erlaubt' 
        : 'NORMAL - Ausgewogener Aufwand, 4-5 Schritte, einfache aber leckere Gerichte';

    const timeHint = cookingTime <= 10 
      ? 'SEHR SCHNELL (≤10 Min) - Nur Schneiden und Braten/Kochen. KEIN Ofen, keine lange Garzeit.'
      : cookingTime <= 20
        ? 'SCHNELL (≤20 Min) - Einfache Gerichte, kurze Garzeiten, maximal eine Pfanne/Topf.'
        : 'NORMAL (30+ Min) - Normale Hausmannskost erlaubt, auch Ofen oder längere Garzeiten.';

    const systemPrompt = `Du bist ein INTELLIGENTER KOCH-ASSISTENT, der DURCHDACHTE Rezepte erstellt.

DEINE AUFGABE:
Analysiere die gegebenen Zutaten und erstelle 3 SINNVOLLE, ECHTE Gerichte.

KONTEXT:
- Verfügbare Zeit: ${cookingTime} Minuten (${timeHint})
- Stimmung: ${moodHint}

DENKPROZESS (WICHTIG!):
1. ZUTATEN-ANALYSE: Welche Zutaten passen geschmacklich und texturell zusammen?
2. GERICHT-LOGIK: Was sind ECHTE Gerichte, die man tatsächlich so kochen würde?
3. ZEIT-REALISMUS: Passt die Zubereitung wirklich in ${cookingTime} Minuten?
4. EMPFEHLUNG: Welches der 3 Gerichte passt AM BESTEN zur Stimmung und Zeit?

VERBOTEN:
- Zufällige Kombinationen wie "Paprika-Salat" oder "Gemüse-Mix"
- Gerichte die nur aus 1-2 Zutaten bestehen
- Unrealistische Zubereitungszeiten
- Langweilige oder unappetitliche Gerichte

ERLAUBT als Basics (immer verfügbar):
Salz, Pfeffer, Öl, Butter, Zwiebeln, Knoblauch, Gewürze

AUSGABE-FORMAT (streng JSON):
{
  "type": "recipes",
  "recommendedIndex": 0,
  "recommendedReason": "Passt perfekt zu deiner Zeit und Stimmung weil...",
  "recipes": [
    {
      "id": "gericht-name",
      "title": "Echter Gerichtname",
      "reason": "Warum dieses Gericht zu den Zutaten passt",
      "calories": 450,
      "protein": 28,
      "carbs": 40,
      "fat": 18,
      "prepTime": ${cookingTime},
      "difficulty": "Einfach/Mittel/Anspruchsvoll",
      "ingredients": ["Zutat mit Menge"],
      "instructions": ["Klarer Kochschritt"]
    }
  ]
}

Bei zu wenigen Zutaten für sinnvolle Gerichte:
{"type":"clarification","message":"Erkläre was fehlt und warum","suggestion":"Eine konkrete Zutat die helfen würde"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Zutaten: ${ingredients.join(", ")}` }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    console.log("[GENERATE-RECIPES] Response:", content.substring(0, 200));

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { type: "clarification", message: "Konnte nicht analysieren.", suggestion: null };
    } catch {
      result = { type: "clarification", message: "Fehler beim Parsen.", suggestion: null };
    }

    if (result.type === "recipes" && result.recipes) {
      result.recipes = result.recipes.map((r: any, i: number) => ({ 
        ...r, 
        id: r.id || `recipe-${Date.now()}-${i}`,
        isRecommended: i === (result.recommendedIndex ?? 0)
      }));
      result.recommendedReason = result.recommendedReason || "Perfekt für deine aktuelle Situation!";
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[GENERATE-RECIPES] Error:", error);
    return new Response(JSON.stringify({ error: "Fehler aufgetreten. Bitte erneut versuchen." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
