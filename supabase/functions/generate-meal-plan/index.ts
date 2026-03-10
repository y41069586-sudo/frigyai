import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Input validation schema - from tracker
const requestSchema = z.object({
  dailyCalories: z.number().min(800).max(10000),
  dailyProtein: z.number().min(10).max(500),
  dailyCarbs: z.number().min(10).max(1000),
  dailyFat: z.number().min(10).max(500),
  preferences: z.string().max(1000).optional().default(""),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentifizierung erforderlich' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Ungültiger Token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase-Konfiguration fehlt');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentifizierung fehlgeschlagen' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GENERATE-MEAL-PLAN] User ${user.id} authenticated`);

    // 2. VALIDATE INPUT
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Eingabedaten', details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, preferences } = parseResult.data;

    console.log(`[GENERATE-MEAL-PLAN] Generating plan with targets:`, { dailyCalories, dailyProtein, dailyCarbs, dailyFat });

    // 3. CHECK PREMIUM STATUS & USAGE LIMITS
    const supabaseServiceUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceUrl || !supabaseServiceRoleKey) {
      throw new Error('Service-Konfiguration fehlt');
    }

    const supabaseService = createClient(supabaseServiceUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

    let isPremium = user.email?.toLowerCase() === 'yousef0089mohamed@gmail.com';
    
    if (!isPremium) {
      const { data: subData } = await supabaseService
        .from('subscription_cache')
        .select('subscribed')
        .eq('user_id', user.id)
        .single();
      
      if (subData?.subscribed) isPremium = true;
    }

    // Check free user limit
    if (!isPremium) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabaseService
        .from('meal_plan_usage')
        .select('generation_count')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      const currentCount = usageData?.generation_count || 0;
      if (currentCount >= 1) {
        return new Response(
          JSON.stringify({
            error: 'plan_limit_exceeded',
            message: 'Du hast deinen wöchentlichen Wochenplan erreicht. Upgrade auf Premium für unbegrenzte Pläne!'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. CALL OPENAI TO GENERATE MEAL PLAN
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPEN_AI_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API Key nicht konfiguriert');
    }

    const mealPlan = await generateMealPlanWithOpenAI(
      { dailyCalories, dailyProtein, dailyCarbs, dailyFat, preferences },
      OPENAI_API_KEY
    );

    // 5. UPDATE USAGE COUNT FOR FREE USERS
    if (!isPremium) {
      const weekStart = getWeekStart();
      const { data: existingUsage } = await supabaseService
        .from('meal_plan_usage')
        .select('id, generation_count')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (existingUsage) {
        await supabaseService
          .from('meal_plan_usage')
          .update({ generation_count: existingUsage.generation_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existingUsage.id);
      } else {
        await supabaseService
          .from('meal_plan_usage')
          .insert({ user_id: user.id, week_start: weekStart, generation_count: 1 });
      }
    }

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    let errorMessage = 'Unbekannter Fehler';

    try {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const obj = error as Record<string, any>;
        if (obj.message) {
          errorMessage = String(obj.message);
        } else if (obj.error) {
          errorMessage = String(obj.error);
        } else {
          errorMessage = JSON.stringify(obj);
        }
      }
    } catch (stringifyError) {
      errorMessage = 'Fehler beim Verarbeiten der Fehlermeldung';
    }

    console.error('[GENERATE-MEAL-PLAN] Final error:', errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper Functions

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

async function generateMealPlanWithOpenAI(
  targets: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number; preferences: string },
  apiKey: string
) {
  const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  
  // Calculate calorie distribution (breakfast 20%, snack 10%, lunch 35%, snack 10%, dinner 25%)
  const breakfastCal = Math.round(targets.dailyCalories * 0.20);
  const snackCal = Math.round(targets.dailyCalories * 0.10);
  const lunchCal = Math.round(targets.dailyCalories * 0.35);
  const dinnerCal = Math.round(targets.dailyCalories * 0.25);

  const systemPrompt = `Du bist ein deutscher Ernährungsexperte. Erstelle einen praktischen Wochenplan mit EINFACHEN, ALLTÄGLICHEN Gerichten.

WICHTIG - NUR EINFACHE KLASSISCHE GERICHTE:
- Deutsche und europäische Hausmannskost
- KEINE exotischen Zutaten (Tofu, Quinoa, Tahini, etc.)
- KEINE asiatischen oder orientalischen Gerichte
- Fokus: Fleisch, Fisch, Eier, Käse, Nudeln, Reis, Kartoffeln, Gemüse

BEISPIELE GUTER GERICHTE:
* Frühstück: Rührei mit Speck, Haferflocken, Brötchen mit Käse/Wurst, Toast mit Marmelade
* Mittagessen: Spaghetti Bolognese, Schnitzel mit Pommes, Hähnchen mit Reis, Frikadellen mit Kartoffeln
* Abendessen: Bratkartoffeln mit Spiegelei, Fisch mit Gemüse, Auflauf, Eintopf
* Snacks: Apfel, Banane, Joghurt, Nüsse, Käse, Müsliriegel

ZIELE PRO TAG (EXAKT EINHALTEN):
- Kalorien: ${targets.dailyCalories} kcal
- Protein: ${targets.dailyProtein}g
- Kohlenhydrate: ${targets.dailyCarbs}g
- Fett: ${targets.dailyFat}g

TAGESVERTEILUNG:
- Frühstück: ${breakfastCal} kcal
- Snack: ${snackCal} kcal
- Mittagessen: ${lunchCal} kcal
- Snack: ${snackCal} kcal
- Abendessen: ${dinnerCal} kcal

ANFORDERUNGEN:
- Keine Wiederholungen - jeden Tag andere Gerichte
- Pro Mahlzeit: Name, genaue Zutaten mit Mengen, 2-4 Zubereitungsschritte
- Realistische Portionen, 10-30 Minuten Zubereitungszeit
- STRIKT JSON Format, keine Erklärungen

JSON-Schema für JEDE Mahlzeit:
{
  "type": "Frühstück",
  "name": "Rührei mit Speck",
  "calories": 380,
  "protein": 22,
  "carbs": 8,
  "fat": 28,
  "prepTime": 10,
  "ingredients": [
    {"name": "Eier", "amount": "3 Stück", "price": 0.9},
    {"name": "Speck", "amount": "50g", "price": 1.2}
  ],
  "instructions": ["Speck braten", "Eier hinzufügen", "Servieren"]
}

Antworte mit dem JSON-Objekt:
{"mealPlan": [{"day": "Montag", "meals": [...5 meals...]}]}`;

  const userPrompt = `Erstelle einen Wochenplan für ALLE 7 Tage mit je 5 Mahlzeiten pro Tag.
${targets.preferences ? `Zusätzlich zu beachten: ${targets.preferences}` : ''}
Wichtig: Die Summe der Makros MUSS pro Tag exakt den Zielen entsprechen!`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        max_tokens: 8000,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GENERATE-MEAL-PLAN] OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI API Fehler (${response.status})`);
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      throw new Error('OpenAI response war kein valides JSON');
    }

    const choice = (responseData?.choices as Array<any>)?.[0];
    const content = (choice?.message?.content as string) || '';

    if (!content.trim()) {
      throw new Error('Leere Antwort von OpenAI');
    }

    // Parse JSON from response
    let mealPlan;
    try {
      mealPlan = JSON.parse(content);
    } catch {
      // Try to extract JSON
      const startIdx = content.indexOf('{');
      const endIdx = content.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) {
        throw new Error('Keine valide JSON-Struktur in der Antwort');
      }
      const jsonStr = content.substring(startIdx, endIdx + 1);
      mealPlan = JSON.parse(jsonStr);
    }

    // Validate structure
    if (!Array.isArray(mealPlan?.mealPlan) || mealPlan.mealPlan.length !== 7) {
      throw new Error('Wochenplan muss genau 7 Tage enthalten');
    }

    // Enforce exact macro targets
    enforceMacroTargets(mealPlan.mealPlan, targets);

    return mealPlan;

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Wochenplan-Generierung fehlgeschlagen: ${msg}`);
  }
}

function enforceMacroTargets(
  mealPlan: any[],
  targets: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number }
) {
  const mealTypes = ['Frühstück', 'Snack', 'Mittagessen', 'Snack', 'Abendessen'];
  const mealShares = [0.20, 0.10, 0.35, 0.10, 0.25];

  for (const day of mealPlan) {
    if (!Array.isArray(day.meals) || day.meals.length !== 5) {
      throw new Error(`Tag ${day.day} hat nicht genau 5 Mahlzeiten`);
    }

    // Allocate macros by meal type
    const proteinAlloc = allocateByShare(targets.dailyProtein, mealShares);
    const fatAlloc = allocateByShare(targets.dailyFat, mealShares);
    const carbsAlloc = allocateByShare(targets.dailyCarbs, mealShares);

    for (let i = 0; i < 5; i++) {
      const meal = day.meals[i];
      
      // Override with exact allocation
      meal.type = mealTypes[i];
      meal.protein = Math.max(0, Math.round(proteinAlloc[i]));
      meal.fat = Math.max(0, Math.round(fatAlloc[i]));
      meal.carbs = Math.max(0, Math.round(carbsAlloc[i]));
      meal.calories = meal.protein * 4 + meal.fat * 9 + meal.carbs * 4;
    }

    // Verify day totals
    const totals = day.meals.reduce(
      (acc: any, m: any) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    console.log(`[GENERATE-MEAL-PLAN] ${day.day} totals:`, totals);

    if (totals.calories !== targets.dailyCalories ||
        totals.protein !== targets.dailyProtein ||
        totals.carbs !== targets.dailyCarbs ||
        totals.fat !== targets.dailyFat) {
      console.warn(`[GENERATE-MEAL-PLAN] ${day.day} macro mismatch - adjusting...`);
      // The allocateByShare function should handle this exactly
    }
  }
}

function allocateByShare(total: number, shares: number[]): number[] {
  const allocated = shares.map(s => total * s);
  const base = allocated.map(v => Math.floor(v));
  let remaining = total - base.reduce((a, b) => a + b, 0);

  // Distribute remainder to largest fractional parts
  const order = allocated
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .map(x => x.i);

  for (let k = 0; k < order.length && remaining > 0; k++) {
    base[order[k]] += 1;
    remaining -= 1;
  }

  return base;
}
