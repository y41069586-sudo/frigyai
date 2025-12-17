import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Input validation schema
const requestSchema = z.object({
  preferences: z.string().max(1000).optional().default(""),
  dailyCalories: z.number().min(800).max(10000).optional(),
  dailyProtein: z.number().min(0).max(500).optional(),
  dailyCarbs: z.number().min(0).max(1000).optional(),
  dailyFat: z.number().min(0).max(500).optional(),
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
    
    // Extract JWT token from header
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Use getUser with the token directly for edge function auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

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
    
    const { preferences, dailyCalories, dailyProtein, dailyCarbs, dailyFat } = parseResult.data;

    const targetCalories = dailyCalories || 1600;
    const targetProtein = dailyProtein || Math.round(targetCalories * 0.3 / 4);
    const targetCarbs = dailyCarbs || Math.round(targetCalories * 0.4 / 4);
    const targetFat = dailyFat || Math.round(targetCalories * 0.3 / 9);

    // Distribution: Breakfast 20%, Snack 10%, Lunch 35%, Snack 10%, Dinner 25%
    const breakfastCal = Math.round(targetCalories * 0.20);
    const snackCal = Math.round(targetCalories * 0.10);
    const lunchCal = Math.round(targetCalories * 0.35);
    const dinnerCal = Math.round(targetCalories * 0.25);

    // Validation ranges (never exceed max; must reach at least min)
    const ranges = {
      calories: { min: Math.round(targetCalories * 0.97), max: targetCalories },
      protein: { min: Math.round(targetProtein * 0.92), max: targetProtein },
      carbs: { min: Math.round(targetCarbs * 0.92), max: targetCarbs },
      fat: { min: Math.round(targetFat * 0.92), max: targetFat },
    };

    const targetsBlock = `ZIELE PRO TAG (müssen pro Tag durch die SUMME der 5 Mahlzeiten erreicht werden, NICHT überschreiten):
- Kalorien: ${targetCalories} kcal (Zielbereich ${ranges.calories.min}–${ranges.calories.max} kcal)
- Protein: ${targetProtein} g (Zielbereich ${ranges.protein.min}–${ranges.protein.max} g)
- Kohlenhydrate: ${targetCarbs} g (Zielbereich ${ranges.carbs.min}–${ranges.carbs.max} g)
- Fett: ${targetFat} g (Zielbereich ${ranges.fat.min}–${ranges.fat.max} g)

WICHTIG:
- Summiere pro Tag Kalorien/Protein/Kohlenhydrate/Fett aller 5 Mahlzeiten.
- Passe Portionen/Grammangaben so an, dass die Tagesziele passen.
- Überschreite NIE die Max-Werte. Wenn du schwankst: lieber knapp UNTER dem Max bleiben, aber NICHT unter das Minimum.`;

    const systemPrompt = `Du bist ein kreativer Ernährungsberater. Erstelle einen ABWECHSLUNGSREICHEN Wochenplan.

WICHTIG - MAXIMALE ABWECHSLUNG:
- JEDES Gericht muss EINZIGARTIG sein! KEINE Wiederholungen!
- Alle 7 Frühstücke müssen KOMPLETT UNTERSCHIEDLICH sein
- Alle 14 Snacks müssen KOMPLETT UNTERSCHIEDLICH sein
- Alle 7 Mittagessen müssen KOMPLETT UNTERSCHIEDLICH sein
- Alle 7 Abendessen müssen KOMPLETT UNTERSCHIEDLICH sein
- Nutze verschiedene Proteinquellen: Hähnchen, Fisch, Rind, Schwein, Tofu, Eier, Hülsenfrüchte
- Nutze verschiedene Beilagen: Reis, Pasta, Kartoffeln, Quinoa, Couscous, Brot
- Nutze verschiedene Zubereitungsarten: gebraten, gekocht, gegrillt, gebacken, roh

${targetsBlock}

Kalorienverteilung pro Tag:
- Frühstück: ${breakfastCal} kcal
- Snack: ${snackCal} kcal
- Mittagessen: ${lunchCal} kcal
- Snack: ${snackCal} kcal
- Abendessen: ${dinnerCal} kcal

Output-Regeln:
- NUR valides JSON (kein Markdown).
- 7 Tage: Montag bis Sonntag.
- Pro Tag genau 5 Mahlzeiten: Frühstück, Snack, Mittagessen, Snack, Abendessen.
- Pro Mahlzeit max 3 Zutaten, max 2 kurze Steps.
- Preise als Zahl (EUR).

JSON-Schema:
{"mealPlan":[{"day":"Montag","meals":[{"type":"Frühstück","name":"...","calories":123,"protein":12,"carbs":12,"fat":12,"prepTime":10,"ingredients":[{"name":"...","amount":"100g","price":1.2}],"instructions":["Schritt 1"]}]}]}`;

    class HttpError extends Error {
      status: number;
      constructor(status: number, message: string) {
        super(message);
        this.status = status;
      }
    }

    const parsePlanFromOpenAI = (data: any) => {
      const choice = data?.choices?.[0];
      const finishReason = choice?.finish_reason;
      const content = choice?.message?.content || '';

      console.log('[GENERATE-MEAL-PLAN] OpenAI finish_reason:', finishReason, 'content_length:', content.length);
      console.log('[GENERATE-MEAL-PLAN] Raw response (first 500 chars):', content.substring(0, 500));

      if (!content.trim()) throw new Error('Leere Antwort von OpenAI');
      if (finishReason === 'length') throw new Error('OpenAI Antwort wurde abgeschnitten (zu lang)');

      try {
        return JSON.parse(content);
      } catch (_e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        return JSON.parse(jsonMatch[0]);
      }
    };

    const validateMealPlan = (plan: any) => {
      const issues: string[] = [];

      if (!Array.isArray(plan?.mealPlan) || plan.mealPlan.length !== 7) {
        issues.push('mealPlan muss ein Array mit 7 Tagen sein');
        return { ok: false, issues };
      }

      for (const day of plan.mealPlan) {
        const dayName = String(day?.day ?? 'Unbekannt');
        const meals = Array.isArray(day?.meals) ? day.meals : [];
        if (meals.length !== 5) {
          issues.push(`${dayName}: muss genau 5 Mahlzeiten haben`);
          continue;
        }

        const totals = meals.reduce(
          (acc: any, m: any) => {
            acc.calories += Number(m?.calories) || 0;
            acc.protein += Number(m?.protein) || 0;
            acc.carbs += Number(m?.carbs) || 0;
            acc.fat += Number(m?.fat) || 0;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        const checks: Array<[keyof typeof ranges, number]> = [
          ['calories', totals.calories],
          ['protein', totals.protein],
          ['carbs', totals.carbs],
          ['fat', totals.fat],
        ];

        for (const [k, v] of checks) {
          const r = ranges[k];
          if (v < r.min || v > r.max) {
            issues.push(`${dayName}: ${k}=${Math.round(v)} (erlaubt ${r.min}–${r.max})`);
          }
        }
      }

      return { ok: issues.length === 0, issues };
    };

    const callOpenAI = async (userInstruction: string) => {
      console.log('[GENERATE-MEAL-PLAN] Calling OpenAI with targets:', { targetCalories, targetProtein, targetCarbs, targetFat });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          // Needs to be large enough for 7 days x 5 meals output
          max_tokens: 12000,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInstruction },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        let errorMessage = `OpenAI API Fehler: ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          const apiMsg = parsed?.error?.message;
          if (apiMsg) errorMessage = `OpenAI API Fehler: ${apiMsg}`;
        } catch {
          // keep fallback
        }

        console.error('[GENERATE-MEAL-PLAN] OpenAI error:', response.status, errorText);
        throw new HttpError(response.status, errorMessage);
      }

      const data = await response.json();
      return parsePlanFromOpenAI(data);
    };

    const generateWithValidation = async () => {
      const baseInstruction = `Erstelle einen kreativen, abwechslungsreichen Wochenplan (Montag bis Sonntag) als EIN einziges JSON-Objekt. ${targetsBlock}

WICHTIG:
- Gib IMMER genau 7 Tage aus (Montag–Sonntag) und pro Tag genau 5 Mahlzeiten.
- Keine Abkürzungen, keine Platzhalter, keine Erklärtexte – nur JSON.
- Stelle sicher, dass JEDER TAG die Tagesziele innerhalb des Zielbereichs trifft und NIEMALS überschreitet.
${preferences ? `
Präferenzen: ${preferences}` : ''}`;

      // Attempt 1
      const first = await callOpenAI(baseInstruction);
      const firstValidation = validateMealPlan(first);
      if (firstValidation.ok) {
        console.log('[GENERATE-MEAL-PLAN] Validation OK (attempt 1)');
        return first;
      }

      console.warn('[GENERATE-MEAL-PLAN] Validation failed (attempt 1):', firstValidation.issues);

      const missingDaysHint = firstValidation.issues.includes('mealPlan muss ein Array mit 7 Tagen sein')
        ? 'Du hast NICHT alle 7 Tage geliefert. Liefere den kompletten Wochenplan Montag–Sonntag mit 5 Mahlzeiten pro Tag.'
        : '';

      // Attempt 2 with explicit correction feedback
      const correction = `KORREKTUR (du MUSST korrigieren):
${missingDaysHint}
Passe PORTIONEN/GRAMMANGABEN (und nur wenn nötig die Mahlzeiten) so an, dass jeder Tag innerhalb der Bereiche liegt (nie überschreiten, nicht unter Minimum).
- ${firstValidation.issues.slice(0, 25).join('\n- ')}`;

      const second = await callOpenAI(`${baseInstruction}\n\n${correction}`);
      const secondValidation = validateMealPlan(second);
      if (secondValidation.ok) {
        console.log('[GENERATE-MEAL-PLAN] Validation OK (attempt 2)');
        return second;
      }

      console.warn('[GENERATE-MEAL-PLAN] Validation failed (attempt 2):', secondValidation.issues);
      throw new Error(`Plan erfüllt die Makro-Zielbereiche nicht: ${secondValidation.issues.slice(0, 6).join(' | ')}`);
    };

    let finalPlan: any;
    try {
      finalPlan = await generateWithValidation();
    } catch (e) {
      if (e instanceof HttpError) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: e.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw e;
    }

    console.log('[GENERATE-MEAL-PLAN] Successfully generated & validated meal plan');

    return new Response(JSON.stringify(finalPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[GENERATE-MEAL-PLAN] Error:', errorMessage);

    return new Response(
      JSON.stringify({ error: `Wochenplan konnte nicht erstellt werden: ${errorMessage}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
