import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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

    // 2. GET REQUEST BODY
    const {
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
      preferences
    } = await req.json();

    // Calculate calorie distribution
    const breakfastCal = Math.round(dailyCalories * 0.20);
    const snackCal = Math.round(dailyCalories * 0.10);
    const lunchCal = Math.round(dailyCalories * 0.35);
    const dinnerCal = Math.round(dailyCalories * 0.25);

    console.log('[GENERATE-MEAL-PLAN] Targets:', { dailyCalories, dailyProtein, dailyCarbs, dailyFat });

    // 3. CHECK PREMIUM STATUS & USAGE LIMITS
    const supabaseServiceUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseService = createClient(supabaseServiceUrl, supabaseServiceRoleKey, { 
      auth: { persistSession: false } 
    });

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

    // 4. CREATE PROMPTS
    const systemPrompt = `Du bist ein deutscher Ernährungsexperte.

Erstelle einen Wochenplan mit einfachen deutschen und europäischen Gerichten.

REGELN:
- Keine exotischen Zutaten (Tofu, Quinoa, Tahini, etc.)
- Keine asiatischen oder orientalischen Gerichte
- Nur einfache Hausmannskost: Fleisch, Fisch, Eier, Käse, Nudeln, Reis, Kartoffeln, Gemüse
- 7 Tage (Montag bis Sonntag)
- Pro Tag genau 5 Mahlzeiten: Frühstück, Snack, Mittagessen, Snack, Abendessen
- Keine Wiederholungen - jeden Tag andere Gerichte
- Realistische Portionen, 10-30 Minuten Zubereitungszeit

MAKROZIELE PRO TAG (EXAKT EINHALTEN):
- Kalorien: ${dailyCalories} kcal
- Protein: ${dailyProtein}g
- Kohlenhydrate: ${dailyCarbs}g
- Fett: ${dailyFat}g

TAGESVERTEILUNG:
- Frühstück: ${breakfastCal} kcal
- Snack: ${snackCal} kcal
- Mittagessen: ${lunchCal} kcal
- Snack: ${snackCal} kcal
- Abendessen: ${dinnerCal} kcal

JEDE MAHLZEIT MUSS ENTHALTEN:
- type: "Frühstück", "Snack", "Mittagessen", "Snack", "Abendessen"
- name: Name des Gerichts
- calories: Genaue Kalorien
- protein: Protein in g
- carbs: Kohlenhydrate in g
- fat: Fett in g
- prepTime: Zubereitungszeit in Minuten
- ingredients: Array mit {name, amount, price}
- instructions: Array mit 2-4 Zubereitungsschritten

WICHTIG:
- Die Summe der Makros pro Tag MUSS exakt den Zielen entsprechen
- NUR valides JSON, keine Erklärungen

ANTWORTFORMAT:
{
  "mealPlan": [
    {
      "day": "Montag",
      "meals": [
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
            {"name": "Speck", "amount": "50g", "price": 1.2},
            {"name": "Butter", "amount": "10g", "price": 0.1}
          ],
          "instructions": ["Speck in der Pfanne braten", "Eier verquirlen und dazugeben", "Bei mittlerer Hitze stocken lassen"]
        }
      ]
    }
  ]
}`;

    const userPrompt = `Erstelle den kompletten Wochenplan für 7 Tage mit je 5 Mahlzeiten pro Tag.

${preferences ? `Zusätzlich zu beachten: ${preferences}` : ''}

Wichtig: Die Summe der Makros MUSS pro Tag exakt ${dailyCalories} kcal, ${dailyProtein}g Protein, ${dailyCarbs}g Carbs und ${dailyFat}g Fett entsprechen!

Antworte NUR mit dem JSON-Objekt, keine weiteren Erklärungen.`;

    // 5. CALL OPENAI
    console.log('[GENERATE-MEAL-PLAN] Calling OpenAI...');

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.8,
          response_format: { type: "json_object" },
          max_tokens: 8000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[GENERATE-MEAL-PLAN] OpenAI error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API Fehler: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Keine Antwort von OpenAI erhalten");
    }

    console.log('[GENERATE-MEAL-PLAN] OpenAI response received');

    // Parse and validate JSON
    let mealPlan;
    try {
      mealPlan = JSON.parse(content);
    } catch (e) {
      console.error('[GENERATE-MEAL-PLAN] JSON parse error:', e);
      throw new Error("OpenAI response war kein valides JSON");
    }

    // Validate structure
    if (!Array.isArray(mealPlan?.mealPlan) || mealPlan.mealPlan.length !== 7) {
      throw new Error("Wochenplan muss genau 7 Tage enthalten");
    }

    // 6. UPDATE USAGE COUNT FOR FREE USERS
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
      console.log(`[GENERATE-MEAL-PLAN] Usage count updated for user ${user.id}`);
    }

    console.log('[GENERATE-MEAL-PLAN] Successfully generated meal plan');

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[GENERATE-MEAL-PLAN] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: "Wochenplan konnte nicht erstellt werden",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
