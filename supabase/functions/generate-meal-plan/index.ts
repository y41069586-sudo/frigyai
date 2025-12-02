import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { preferences } = await req.json();

    const systemPrompt = `Du bist ein erfahrener Ernährungsberater für gesunde, kalorienarme Mahlzeiten zum Abnehmen.
Generiere einen Wochenplan mit Frühstück, Mittagessen und Abendessen für jeden Tag (Montag bis Sonntag).

Regeln:
- Jede Mahlzeit unter 500 Kalorien
- Hoher Proteingehalt
- Einfache Zubereitung (unter 20 Minuten)
- Realistische deutsche Gerichte
- Genaue Zutaten mit Mengenangaben
- Schritt-für-Schritt Anleitung

Antworte NUR mit validem JSON in diesem Format:
{
  "mealPlan": [
    {
      "day": "Montag",
      "meals": [
        {
          "type": "Frühstück",
          "name": "Name des Gerichts",
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 12,
          "prepTime": 10,
          "ingredients": [
            {"name": "Zutat 1", "amount": "100g", "price": 1.50},
            {"name": "Zutat 2", "amount": "50g", "price": 0.80}
          ],
          "instructions": ["Schritt 1", "Schritt 2", "Schritt 3"]
        }
      ]
    }
  ]
}`;

    console.log('[GENERATE-MEAL-PLAN] Calling AI gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Erstelle einen abwechslungsreichen Wochenplan für gesunde Mahlzeiten. ${preferences ? `Präferenzen: ${preferences}` : ''}` }
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
