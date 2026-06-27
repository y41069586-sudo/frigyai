import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const requestSchema = z.object({
  ingredients: z.array(z.string().min(1).max(100)).min(1).max(50),
  cookingTime: z.number().optional().default(20),
  mood: z.enum(['tired', 'normal', 'motivated', 'stressed']).optional().default('normal'),
  isOnboarding: z.boolean().optional().default(false),
  macroBudget: z.object({
    remainingCalories: z.number(),
    remainingProtein: z.number(),
    remainingCarbs: z.number(),
    remainingFat: z.number(),
  }).optional(),
  userProfile: z.object({
    goalMode: z.enum(['lose', 'gain']).optional(),
    age: z.number().optional(),
    weight: z.number().optional(),
  }).optional(),
  mealToReplace: z.string().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Parse request first to check isOnboarding flag
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { ingredients, cookingTime, mood, isOnboarding, macroBudget, userProfile, mealToReplace } = parseResult.data;
    
    // Auth check - optional for onboarding
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader && authHeader !== 'Bearer null' && authHeader !== 'Bearer undefined') {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!authError && user) {
        userId = user.id;
      }
    }
    
    // Block non-onboarding guests
    if (!userId && !isOnboarding) {
      return new Response(JSON.stringify({ error: 'Auth required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log("[GENERATE-RECIPES] Mode:", isOnboarding ? 'ONBOARDING (FREE)' : 'USER');
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    console.log("[GENERATE-RECIPES] Context:", {
      ingredients: ingredients.length,
      time: cookingTime,
      mood,
      hasMacroBudget: !!macroBudget,
      hasUserProfile: !!userProfile,
      mealToReplace
    });

    // Mood-basierte Anpassungen
    const moodHint = mood === 'tired' 
      ? 'MÜDE - Minimaler Aufwand, One-Pot-Gerichte, maximal 4 Schritte, keine komplizierten Techniken, einfache Zutaten' 
      : mood === 'motivated' 
        ? 'MOTIVIERT - Kann aufwändiger sein, mehrere Komponenten, bis zu 6-7 Schritte erlaubt, kreative Gerichte' 
        : 'NORMAL - Ausgewogener Aufwand, 4-5 Schritte, einfache aber leckere Gerichte';

    // Zeit-basierte Anpassungen
    const timeHint = cookingTime <= 10 
      ? 'SEHR SCHNELL (≤10 Min) - Nur Schneiden und Braten/Kochen. KEIN Ofen, keine lange Garzeit. Salate, Wraps, gebratene Gerichte.'
      : cookingTime <= 20
        ? 'SCHNELL (≤20 Min) - Einfache Gerichte, kurze Garzeiten, maximal eine Pfanne/Topf. Nudeln, Reis-Pfannen, Omeletts.'
        : 'NORMAL (30+ Min) - Normale Hausmannskost erlaubt, auch Ofen oder längere Garzeiten.';

    // Makro-Budget Constraints
    let macroConstraint = '';
    if (macroBudget) {
      macroConstraint = `
KRITISCHE MAKRO-GRENZEN (NICHT ÜBERSCHREITEN!):
- Max Kalorien: ${macroBudget.remainingCalories} kcal
- Max Protein: ${macroBudget.remainingProtein}g
- Max Kohlenhydrate: ${macroBudget.remainingCarbs}g
- Max Fett: ${macroBudget.remainingFat}g

Das Rezept MUSS innerhalb dieser Grenzen liegen! Passe die Portionsgrößen entsprechend an.`;
    }

    // Ziel-basierte Anpassungen
    let goalHint = '';
    if (userProfile?.goalMode) {
      goalHint = userProfile.goalMode === 'lose'
        ? '\nZIEL: ABNEHMEN - Priorisiere proteinreiche, kalorienarme Gerichte. Weniger Kohlenhydrate, mehr Gemüse.'
        : '\nZIEL: ZUNEHMEN - Füge gesunde Fettquellen hinzu (Avocado, Nüsse, Olivenöl). Größere Portionen, mehr Kalorien.';
    }

    const systemPrompt = `Du bist ein INTELLIGENTER ERNÄHRUNGS-COACH, der PERFEKT ANGEPASSTE Rezepte erstellt.

DEINE AUFGABE:
Analysiere die Zutaten und erstelle 3 OPTIMALE Gerichte, die perfekt zum Nutzer-Kontext passen.

KONTEXT:
- Verfügbare Zeit: ${cookingTime} Minuten (${timeHint})
- Stimmung: ${moodHint}
${macroConstraint}
${goalHint}
${mealToReplace ? `- Mahlzeit: ${mealToReplace}` : ''}

DENKPROZESS (WICHTIG!):
1. ZUTATEN-ANALYSE: Welche Zutaten passen geschmacklich und texturell zusammen?
2. MAKRO-OPTIMIERUNG: Wie kann ich das Makro-Budget optimal ausnutzen ohne zu überschreiten?
3. PSYCHOLOGIE: Bei Müdigkeit = Comfort Food mit wenig Aufwand. Bei Stress = schnell und sättigend.
4. ZEIT-REALISMUS: Passt die Zubereitung wirklich in ${cookingTime} Minuten?
5. EMPFEHLUNG: Welches der 3 Gerichte passt AM BESTEN zur Gesamtsituation?

VERBOTEN:
- Rezepte die das Makro-Budget überschreiten
- Zufällige Kombinationen wie "Paprika-Salat" ohne Sinn
- Unrealistische Zubereitungszeiten
- Bei "müde" komplizierte Rezepte

ERLAUBT als Basics (immer verfügbar):
Salz, Pfeffer, Öl, Butter, Zwiebeln, Knoblauch, Gewürze, Kräuter

AUSGABE-FORMAT (streng JSON):
{
  "type": "recipes",
  "analyse": {
    "gefundene_zutaten": ["Zutat A", "Zutat B"],
    "beste_kombinationen": "Erklärung welche Zutaten gut zusammenpassen",
    "makro_optimierung": "Wie die Rezepte zum Budget passen"
  },
  "recommendedIndex": 0,
  "recommendedReason": "Passt perfekt weil... (Bezug auf Stimmung, Zeit UND Makros)",
  "recipes": [
    {
      "id": "gericht-name",
      "title": "Echter Gerichtname",
      "reason": "Warum dieses Gericht zu den Zutaten und deiner Situation passt",
      "calories": 450,
      "protein": 28,
      "carbs": 40,
      "fat": 18,
      "prepTime": ${cookingTime},
      "difficulty": "Einfach/Mittel/Anspruchsvoll",
      "ingredients": ["Menge Zutat"],
      "instructions": ["Klarer Kochschritt"]
    }
  ],
  "wochenplan_anpassung": {
    "aktion": "REPLACE",
    "mahlzeit": "${mealToReplace || 'Nicht angegeben'}",
    "neues_tagesbudget_nach_mahlzeit": {
      "kcal": "verbleibend",
      "protein": "verbleibend",
      "carbs": "verbleibend",
      "fat": "verbleibend"
    }
  }
}

Bei zu wenigen Zutaten:
{"type":"clarification","message":"Erkläre was fehlt","suggestion":"Eine konkrete Zutat die helfen würde"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Zutaten: ${ingredients.join(", ")}` }
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    console.log("[GENERATE-RECIPES] Response length:", content.length);

    let result;
    try {
      // Try direct parse first
      try {
        result = JSON.parse(content);
      } catch (e) {
        // Safer extraction: find first { and last }
        const trimmed = content.trim();
        const startIdx = trimmed.indexOf('{');
        const endIdx = trimmed.lastIndexOf('}');

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
          console.warn('[GENERATE-RECIPES] Cannot find JSON boundaries');
          result = { type: "clarification", message: "Konnte Antwort nicht verarbeiten.", suggestion: null };
        } else {
          const jsonStr = trimmed.substring(startIdx, endIdx + 1);
          result = JSON.parse(jsonStr);
        }
      }
    } catch (error) {
      console.error('[GENERATE-RECIPES] Parse error:', error);
      result = { type: "clarification", message: "Fehler beim Parsen der Rezepte.", suggestion: null };
    }

    if (result.type === "recipes" && result.recipes) {
      result.recipes = result.recipes.map((r: any, i: number) => ({ 
        ...r, 
        id: r.id || `recipe-${Date.now()}-${i}`,
        isRecommended: i === (result.recommendedIndex ?? 0)
      }));
      result.recommendedReason = result.recommendedReason || "Perfekt für deine aktuelle Situation!";
      
      // Berechne verbleibendes Budget nach empfohlenem Rezept
      if (macroBudget && result.recipes[result.recommendedIndex ?? 0]) {
        const recommended = result.recipes[result.recommendedIndex ?? 0];
        result.budgetAfterMeal = {
          remainingCalories: Math.max(0, macroBudget.remainingCalories - (recommended.calories || 0)),
          remainingProtein: Math.max(0, macroBudget.remainingProtein - (recommended.protein || 0)),
          remainingCarbs: Math.max(0, macroBudget.remainingCarbs - (recommended.carbs || 0)),
          remainingFat: Math.max(0, macroBudget.remainingFat - (recommended.fat || 0)),
        };
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[GENERATE-RECIPES] Error:", error);
    return new Response(JSON.stringify({ error: "Fehler aufgetreten. Bitte erneut versuchen." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
