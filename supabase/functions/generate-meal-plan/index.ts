import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
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

    // Check premium status
    let isPremium = user.email?.toLowerCase() === 'yousef0089mohamed@gmail.com';
    const userEmail = user.email;

    // Check database cache first (it's much faster than Stripe API)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    if (!isPremium) {
      const { data: subData } = await supabaseService
        .from('subscription_cache')
        .select('subscribed')
        .eq('user_id', user.id)
        .single();

      if (subData?.subscribed) {
        isPremium = true;
        console.log(`User ${user.id} has premium from database cache`);
      }
    }

    // Fallback to Stripe check if still not premium
    if (!isPremium && userEmail) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
          const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
          if (customers.data.length > 0) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customers.data[0].id,
              status: "active",
              limit: 1,
            });
            isPremium = subscriptions.data.length > 0;
            if (isPremium) console.log(`User ${user.id} has premium from Stripe directly`);
          }
        } catch (stripeError) {
          console.error("Stripe check error:", stripeError);
        }
      }
    }

    // Helper to get start of current week (Monday)
    const getWeekStart = (): string => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    // Check meal plan generation limit for free users (1 per week)
    const FREE_PLAN_LIMIT = 1;
    if (!isPremium) {
      const weekStart = getWeekStart();

      const { data: usageData } = await supabaseService
        .from('meal_plan_usage')
        .select('generation_count')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      const currentCount = usageData?.generation_count || 0;

      if (currentCount >= FREE_PLAN_LIMIT) {
        console.log(`User ${user.id} exceeded free weekly meal plan limit (${currentCount}/${FREE_PLAN_LIMIT})`);
        return new Response(
          JSON.stringify({ 
            error: "plan_limit_exceeded",
            message: "Du hast deinen wöchentlichen Wochenplan erreicht. Upgrade auf Premium für unbegrenzte Pläne!",
            plansUsed: currentCount,
            plansLimit: FREE_PLAN_LIMIT
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`User ${user.id} weekly meal plan count: ${currentCount}/${FREE_PLAN_LIMIT}`);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPEN_AI_KEY');
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

    const targetCaloriesRequested = dailyCalories || 1600;
    const targetProtein = dailyProtein || Math.round(targetCaloriesRequested * 0.3 / 4);
    const targetFat = dailyFat || Math.round(targetCaloriesRequested * 0.3 / 9);

    // IMPORTANT: Calories/Protein/Fat/Carbs can be mathematically inconsistent due to integer rounding.
    // To keep the plan "perfekt" and internally consistent, we derive carbs from kcal/protein/fat
    // and floor to never exceed the calorie target.
    const requestedCarbs = dailyCarbs ?? Math.round(targetCaloriesRequested * 0.4 / 4);
    const carbsFloat = (targetCaloriesRequested - targetProtein * 4 - targetFat * 9) / 4;
    let targetCarbs = Number.isFinite(carbsFloat) ? Math.max(0, Math.floor(carbsFloat)) : requestedCarbs;

    // Effective calories that can actually be represented by integer macros
    let targetCalories = targetProtein * 4 + targetFat * 9 + targetCarbs * 4;
    if (targetCalories > targetCaloriesRequested) {
      targetCarbs = Math.max(0, Math.floor((targetCaloriesRequested - targetProtein * 4 - targetFat * 9) / 4));
      targetCalories = targetProtein * 4 + targetFat * 9 + targetCarbs * 4;
    }

    // Distribution: Breakfast 20%, Snack 10%, Lunch 35%, Snack 10%, Dinner 25%
    const breakfastCal = Math.round(targetCaloriesRequested * 0.20);
    const snackCal = Math.round(targetCaloriesRequested * 0.10);
    const lunchCal = Math.round(targetCaloriesRequested * 0.35);
    const dinnerCal = Math.round(targetCaloriesRequested * 0.25);

    // "Perfekt" targets: we enforce exact daily totals (within what integer macros can represent).
    const ranges = {
      calories: { min: targetCalories, max: targetCalories },
      protein: { min: targetProtein, max: targetProtein },
      carbs: { min: targetCarbs, max: targetCarbs },
      fat: { min: targetFat, max: targetFat },
    };

    const targetsBlock = `ZIELE PRO TAG (müssen pro Tag durch die SUMME der 5 Mahlzeiten erreicht werden, NICHT überschreiten):
- Kalorien: ${targetCalories} kcal (exakt)
- Protein: ${targetProtein} g (exakt)
- Kohlenhydrate: ${targetCarbs} g (exakt)
- Fett: ${targetFat} g (exakt)

WICHTIG:
- Summiere pro Tag Kalorien/Protein/Kohlenhydrate/Fett aller 5 Mahlzeiten.
- Überschreite NIE diese Werte.`;

    const systemPrompt = `Du bist ein deutscher Hausmannskost-Experte. Erstelle einen ALLTAGSTAUGLICHEN Wochenplan mit EINFACHEN, BELIEBTEN Gerichten die jeder kennt und mag!

WICHTIG - NUR EINFACHE, ALLTÄGLICHE GERICHTE:
- Verwende KLASSISCHE deutsche und europäische Gerichte die man regelmäßig isst
- KEINE exotischen Zutaten wie Tofu, Quinoa, Bulgur, Tahini, Miso, etc.
- KEINE komplizierten asiatischen, orientalischen oder ausgefallenen Gerichte
- Fokus auf: Fleisch, Fisch, Eier, Käse, Nudeln, Reis, Kartoffeln, Gemüse

BEISPIELE FÜR GUTE GERICHTE:
* Frühstück: Rührei mit Speck, Müsli mit Milch, Brötchen mit Käse/Wurst, Haferbrei mit Banane, Joghurt mit Früchten, Vollkornbrot mit Ei
* Mittagessen: Spaghetti Bolognese, Schnitzel mit Pommes, Hähnchen mit Reis, Nudeln mit Sahnesauce, Frikadellen mit Kartoffeln, Pizza, Burger
* Abendessen: Bratkartoffeln mit Spiegelei, Ofenhähnchen mit Gemüse, Lachs mit Kartoffeln, Würstchen mit Sauerkraut, Auflauf, Suppe mit Brot
* Snacks: Apfel, Banane, Joghurt, Käsewürfel, Nüsse, Müsliriegel, Quark mit Früchten

STRENGE REGELN:
- KEINE Wiederholungen - jeden Tag andere Gerichte
- Einfache Zutaten die es in jedem Supermarkt gibt
- Realistische Portionsgrößen
- Gerichte die man in 10-30 Minuten zubereiten kann
- KEINE Fertiggerichte, aber trotzdem einfach

KURZE, KLARE ANLEITUNGEN:
- 2-4 einfache Schritte pro Gericht
- Keine komplizierten Techniken

${targetsBlock}

Kalorienverteilung pro Tag:
- Frühstück: ${breakfastCal} kcal
- Snack: ${snackCal} kcal
- Mittagessen: ${lunchCal} kcal
- Snack: ${snackCal} kcal
- Abendessen: ${dinnerCal} kcal

Output-Regeln:
- NUR valides JSON (kein Markdown)
- 7 Tage: Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag
- Pro Tag genau 5 Mahlzeiten: Frühstück, Snack, Mittagessen, Snack, Abendessen
- Pro Mahlzeit 3-5 einfache Zutaten mit genauen Mengen
- Pro Mahlzeit 2-4 kurze Zubereitungsschritte
- Preise als Zahl (EUR)

JSON-Schema:
{"mealPlan":[{"day":"Montag","meals":[{"type":"Frühstück","name":"Rührei mit Speck","calories":380,"protein":22,"carbs":8,"fat":28,"prepTime":10,"ingredients":[{"name":"Eier","amount":"3 Stück","price":0.9},{"name":"Speck","amount":"50g","price":1.2},{"name":"Butter","amount":"10g","price":0.1}],"instructions":["Speck in der Pfanne knusprig braten.","Eier verquirlen und dazugeben.","Bei mittlerer Hitze stocken lassen und servieren."]}]}]}`;

    class HttpError extends Error {
      status: number;
      constructor(status: number, message: string) {
        super(message);
        this.status = status;
      }
    }

    const parsePlanFromOpenAI = (data: unknown): Record<string, unknown> => {
      const response = data as Record<string, unknown>;
      const choice = (response?.choices as Array<any>)?.[0];
      const finishReason = choice?.finish_reason;
      const content = (choice?.message?.content as string) || '';

      console.log('[GENERATE-MEAL-PLAN] OpenAI finish_reason:', finishReason, 'content_length:', content.length);

      if (!content.trim()) throw new Error('Leere Antwort von OpenAI');
      if (finishReason === 'length') throw new Error('OpenAI Antwort wurde abgeschnitten (zu lang)');

      // Try direct JSON parse first (best case - response is pure JSON)
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, unknown>;
        }
        throw new Error('Parsed JSON is not an object');
      } catch (e) {
        console.log('[GENERATE-MEAL-PLAN] Direct parse failed, attempting safer extraction');
      }

      // Safer extraction: find the first { and match it with the last }
      const trimmed = content.trim();
      const startIdx = trimmed.indexOf('{');
      const endIdx = trimmed.lastIndexOf('}');

      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        console.error('[GENERATE-MEAL-PLAN] Cannot find JSON boundaries in response');
        console.error('[GENERATE-MEAL-PLAN] Response:', content.substring(0, 1000));
        throw new Error('Cannot extract JSON from OpenAI response - invalid format');
      }

      const jsonStr = trimmed.substring(startIdx, endIdx + 1);

      try {
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, unknown>;
        }
        throw new Error('Parsed JSON is not an object');
      } catch (e) {
        console.error('[GENERATE-MEAL-PLAN] JSON parse failed after extraction');
        console.error('[GENERATE-MEAL-PLAN] Extracted:', jsonStr.substring(0, 500));
        throw new Error(`Invalid JSON in response: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    };

    const MEAL_TYPES = ['Frühstück', 'Snack', 'Mittagessen', 'Snack', 'Abendessen'] as const;
    const MEAL_SHARES = [0.20, 0.10, 0.35, 0.10, 0.25] as const;

    const allocateByShares = (total: number, shares: readonly number[]) => {
      const raw = shares.map((s) => total * s);
      const base = raw.map((v) => Math.floor(v));
      let remaining = total - base.reduce((a, b) => a + b, 0);

      // distribute remainder to largest fractional parts
      const order = raw
        .map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac)
        .map((x) => x.i);

      for (let k = 0; k < order.length && remaining > 0; k++) {
        base[order[k]] += 1;
        remaining -= 1;
      }

      return base;
    };

    const validatePlanStructure = (plan: unknown) => {
      const issues: string[] = [];
      const planObj = plan as Record<string, unknown>;

      if (!Array.isArray(planObj?.mealPlan) || planObj.mealPlan.length !== 7) {
        issues.push('mealPlan muss ein Array mit 7 Tagen sein');
        return { ok: false, issues };
      }

      for (const day of planObj.mealPlan) {
        const dayObj = day as Record<string, unknown>;
        const dayName = String(dayObj?.day ?? 'Unbekannt');
        const meals = Array.isArray(dayObj?.meals) ? dayObj.meals : [];
        if (meals.length !== 5) {
          issues.push(`${dayName}: muss genau 5 Mahlzeiten haben`);
          continue;
        }

        for (let i = 0; i < meals.length; i++) {
          const m = meals[i] as Record<string, unknown>;
          if (!m?.name) issues.push(`${dayName}: Mahlzeit ${i + 1} hat keinen Namen`);
          if (!Array.isArray(m?.ingredients) || m.ingredients.length === 0) {
            issues.push(`${dayName}: ${String(m?.name ?? `Mahlzeit ${i + 1}`)}: keine Zutaten`);
          }
          if (!Array.isArray(m?.instructions) || m.instructions.length === 0) {
            issues.push(`${dayName}: ${String(m?.name ?? `Mahlzeit ${i + 1}`)}: keine Steps`);
          }
        }
      }

      return { ok: issues.length === 0, issues };
    };

    // Enforce "perfect" daily macro totals deterministically (names/ingredients remain as generated)
    const enforceMacroTargets = (plan: unknown) => {
      const planObj = plan as Record<string, unknown>;
      if (!planObj || !Array.isArray(planObj.mealPlan)) return planObj;

      const proteinAlloc = allocateByShares(targetProtein, MEAL_SHARES);
      const fatAlloc = allocateByShares(targetFat, MEAL_SHARES);
      const carbsAlloc = allocateByShares(targetCarbs, MEAL_SHARES);

      for (const day of planObj.mealPlan) {
        const dayObj = day as Record<string, unknown>;
        if (!Array.isArray(dayObj?.meals) || dayObj.meals.length !== 5) continue;

        for (let i = 0; i < 5; i++) {
          const meal = dayObj.meals[i] as Record<string, unknown>;
          const protein = Math.max(0, Math.round(proteinAlloc[i] || 0));
          const fat = Math.max(0, Math.round(fatAlloc[i] || 0));
          const carbs = Math.max(0, Math.round(carbsAlloc[i] || 0));
          const calories = protein * 4 + fat * 9 + carbs * 4;

          meal.type = MEAL_TYPES[i];
          meal.protein = protein;
          meal.fat = fat;
          meal.carbs = carbs;
          meal.calories = calories;
        }
      }

      return planObj;
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
          // Optimized for faster generation: 8000 tokens is sufficient for 7 days x 5 meals
          max_tokens: 8000,
          temperature: 0.95,
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
      const baseInstruction = `Erstelle einen vollständigen Wochenplan für ALLE 7 Tage als JSON.

KRITISCH - Du MUSST genau diese Struktur einhalten:
- Genau 7 Tage im Array: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
- Jeder Tag hat genau 5 Mahlzeiten: ["Frühstück", "Snack", "Mittagessen", "Snack", "Abendessen"]
- Gib das VOLLSTÄNDIGE JSON aus, nicht abkürzen!

${targetsBlock}

${preferences ? `Präferenzen: ${preferences}` : ''}

Antworte NUR mit dem vollständigen JSON-Objekt, keine Erklärungen.`;

      const MAX_ATTEMPTS = 3;
      
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const instruction = attempt === 1 
            ? baseInstruction 
            : `${baseInstruction}\n\nWICHTIG: Vorheriger Versuch war unvollständig. Gib ALLE 7 Tage mit je 5 Mahlzeiten aus!`;
          
          const result = await callOpenAI(instruction);
          const validation = validatePlanStructure(result);
          
          if (validation.ok) {
            console.log(`[GENERATE-MEAL-PLAN] Structure OK (attempt ${attempt})`);
            return result;
          }
          
          console.warn(`[GENERATE-MEAL-PLAN] Structure failed (attempt ${attempt}):`, validation.issues);
          
          if (attempt === MAX_ATTEMPTS) {
            throw new Error(`Planstruktur ungültig: ${validation.issues.slice(0, 3).join(' | ')}`);
          }
        } catch (e) {
          if (attempt === MAX_ATTEMPTS) throw e;
          console.warn(`[GENERATE-MEAL-PLAN] Attempt ${attempt} error:`, e);
        }
      }
      
      throw new Error('Wochenplan konnte nach mehreren Versuchen nicht erstellt werden');
    };

    const finalizePlan = (plan: unknown) => {
      const normalized = enforceMacroTargets(plan) as Record<string, unknown>;

      // Final strict validation (must match exact targets)
      const mealPlan = Array.isArray(normalized?.mealPlan) ? normalized.mealPlan : [];
      for (const day of mealPlan) {
        const dayObj = day as Record<string, unknown>;
        const meals = Array.isArray(dayObj?.meals) ? dayObj.meals : [];
        const totals = meals.reduce(
          (acc: Record<string, number>, m: unknown) => {
            const meal = m as Record<string, unknown>;
            acc.calories += Number(meal?.calories) || 0;
            acc.protein += Number(meal?.protein) || 0;
            acc.carbs += Number(meal?.carbs) || 0;
            acc.fat += Number(meal?.fat) || 0;
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
            throw new Error(`${String(dayObj?.day ?? 'Tag')}: ${k}=${Math.round(v)} (erlaubt ${r.min}–${r.max})`);
          }
        }
      }

      return normalized;
    };

    let finalPlan: any;
    try {
      finalPlan = await generateWithValidation();
      finalPlan = finalizePlan(finalPlan);
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

    // Increment meal plan count for free users ONLY after successful generation
    if (!isPremium) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabaseService
        .from('meal_plan_usage')
        .select('generation_count')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      const currentCount = usageData?.generation_count || 0;

      if (usageData) {
        await supabaseService
          .from('meal_plan_usage')
          .update({ generation_count: currentCount + 1, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('week_start', weekStart);
      } else {
        await supabaseService
          .from('meal_plan_usage')
          .insert({ user_id: user.id, week_start: weekStart, generation_count: 1 });
      }
      console.log(`User ${user.id} usage incremented to ${currentCount + 1}`);
    }

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
