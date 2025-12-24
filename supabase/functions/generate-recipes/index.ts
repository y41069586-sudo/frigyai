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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log("[GENERATE-RECIPES] Ingredients:", ingredients, "Time:", cookingTime, "Mood:", mood);

    const moodHint = mood === 'tired' ? 'Sehr einfach, max 3 Schritte' : mood === 'motivated' ? 'Kann aufwändiger sein' : 'Normal';

    const systemPrompt = `Erstelle 3 Rezepte aus diesen Zutaten. Zeit: ${cookingTime}min. Aufwand: ${moodHint}.

Regeln:
- Nur gegebene Zutaten + Basics (Öl, Salz, Gewürze)
- Realistische Portionen und Nährwerte
- Deutsche Namen

JSON-Format:
{"type":"recipes","recipes":[{"id":"kebab-case","title":"Name","calories":400,"protein":25,"carbs":35,"fat":15,"prepTime":${cookingTime},"difficulty":"Einfach","ingredients":["Zutat mit Menge"],"instructions":["Schritt 1","Schritt 2"]}]}

Bei zu wenig Zutaten: {"type":"clarification","message":"Erklärung","suggestion":"Zutat"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
    console.log("[GENERATE-RECIPES] Response:", content.substring(0, 200));

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { type: "clarification", message: "Konnte nicht analysieren.", suggestion: null };
    } catch {
      result = { type: "clarification", message: "Fehler beim Parsen.", suggestion: null };
    }

    if (result.type === "recipes" && result.recipes) {
      result.recipes = result.recipes.map((r: any, i: number) => ({ ...r, id: r.id || `recipe-${Date.now()}-${i}` }));
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[GENERATE-RECIPES] Error:", error);
    return new Response(JSON.stringify({ error: "Fehler aufgetreten. Bitte erneut versuchen." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
