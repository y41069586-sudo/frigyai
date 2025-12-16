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

    const systemPrompt = `Du bist ein erfahrener Ernährungsberater für gesunde, kalorienarme Mahlzeiten zum Abnehmen.
Generiere einen Wochenplan mit Frühstück, Snack (vormittags), Mittagessen, Snack (nachmittags) und Abendessen für jeden Tag (Montag bis Sonntag).

WICHTIG - Tägliche Ziele:
- Kalorien: ${targetCalories} kcal
- Protein: ${targetProtein}g (high priority!)
- Kohlenhydrate: ${targetCarbs}g
- Fett: ${targetFat}g

Kalorienverteilung pro Mahlzeit:
- Frühstück: ca. ${breakfastCal} kcal (20%)
- Snack (vormittags): ca. ${snackCal} kcal (10%)
- Mittagessen: ca. ${lunchCal} kcal (35%)
- Snack (nachmittags): ca. ${snackCal} kcal (10%)
- Abendessen: ca. ${dinnerCal} kcal (25%)

Regeln:
- Die Summe aller 5 Mahlzeiten pro Tag MUSS ungefähr ${targetCalories} kcal ergeben!
- Tägliches Protein MUSS ungefähr ${targetProtein}g erreichen!
- Hoher Proteingehalt bei jeder Mahlzeit
- Snacks: proteinreich und sättigend (z.B. Griechischer Joghurt, Nüsse, Proteinriegel, Quark, Eier)
- Einfache Zubereitung (unter 20 Minuten)
- Realistische deutsche Gerichte
- Genaue Zutaten mit Mengenangaben und realistischen Preisen

Antworte NUR mit validem JSON in diesem Format:
{
  "mealPlan": [
    {
      "day": "Montag",
      "meals": [
        {
          "type": "Frühstück",
          "name": "Name des Gerichts",
          "calories": ${breakfastCal},
          "protein": 25,
          "carbs": 30,
          "fat": 12,
          "prepTime": 10,
          "ingredients": [
            {"name": "Zutat 1", "amount": "100g", "price": 1.50},
            {"name": "Zutat 2", "amount": "50g", "price": 0.80}
          ],
          "instructions": ["Schritt 1", "Schritt 2", "Schritt 3"]
        },
        {
          "type": "Snack",
          "name": "Griechischer Joghurt mit Nüssen",
          "calories": ${snackCal},
          "protein": 15,
          "carbs": 10,
          "fat": 8,
          "prepTime": 2,
          "ingredients": [
            {"name": "Griechischer Joghurt 0%", "amount": "150g", "price": 0.90}
          ],
          "instructions": ["Joghurt in Schüssel geben", "Mit Nüssen toppen"]
        },
        {
          "type": "Mittagessen",
          "name": "...",
          "calories": ${lunchCal},
          ...
        },
        {
          "type": "Snack",
          "name": "...",
          "calories": ${snackCal},
          ...
        },
        {
          "type": "Abendessen",
          "name": "...",
          "calories": ${dinnerCal},
          ...
        }
      ]
    }
  ]
}`;

    console.log('[GENERATE-MEAL-PLAN] Calling OpenAI with targets:', { targetCalories, targetProtein, targetCarbs, targetFat });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Erstelle einen abwechslungsreichen Wochenplan für gesunde Mahlzeiten mit ${targetCalories} kcal und ${targetProtein}g Protein pro Tag. Jeder Tag muss ALLE 5 Mahlzeiten haben: Frühstück, Snack, Mittagessen, Snack, Abendessen. ${preferences ? `Präferenzen: ${preferences}` : ''}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GENERATE-MEAL-PLAN] AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[GENERATE-MEAL-PLAN] Raw response:', content.substring(0, 500));

    // Parse JSON from response
    let mealPlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mealPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[GENERATE-MEAL-PLAN] Parse error:', parseError);
      throw new Error('Failed to parse meal plan');
    }

    console.log('[GENERATE-MEAL-PLAN] Successfully generated meal plan');

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[GENERATE-MEAL-PLAN] Error:', error);
    return new Response(JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
