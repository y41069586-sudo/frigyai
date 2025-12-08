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

    const { food, imageBase64 } = await req.json();

    const systemPrompt = `Du bist ein zertifizierter Ernährungsberater mit Expertise in Lebensmittelanalyse und Makronährstoffberechnung.

AUFGABE: Analysiere das Essen präzise und berechne die Nährwerte basierend auf wissenschaftlichen Datenbanken (USDA, BLS).

ANALYSE-METHODE:
1. Identifiziere ALLE sichtbaren Zutaten und deren geschätzte Mengen
2. Berücksichtige Zubereitungsart (roh, gekocht, gebraten - beeinflusst Kaloriengehalt)
3. Schätze realistische Portionsgrößen basierend auf Tellergrößen/Referenzobjekten
4. Berechne Makros für JEDE Zutat separat, dann summiere

NÄHRWERT-REFERENZEN (pro 100g):
- Hähnchenbrust (gekocht): 165 kcal, 31g P, 0g K, 3.6g F
- Reis (gekocht): 130 kcal, 2.7g P, 28g K, 0.3g F
- Lachs (gebraten): 208 kcal, 20g P, 0g K, 13g F
- Ei (gekocht): 155 kcal, 13g P, 1.1g K, 11g F
- Avocado: 160 kcal, 2g P, 9g K, 15g F
- Olivenöl: 884 kcal, 0g P, 0g K, 100g F (1 EL = ~14g = 124 kcal)
- Brokkoli (gekocht): 35 kcal, 2.8g P, 7g K, 0.4g F
- Kartoffeln (gekocht): 77 kcal, 2g P, 17g K, 0.1g F
- Vollkornbrot: 247 kcal, 13g P, 41g K, 4.2g F

WICHTIGE REGELN:
- Runde Kalorien auf 5er-Schritte
- Protein, Kohlenhydrate, Fett auf ganze Zahlen
- Berücksichtige versteckte Kalorien: Öl, Butter, Saucen, Dressings
- Bei Unklarheit: Schätze konservativ (lieber etwas höher)

Antworte NUR mit validem JSON in diesem Format:
{
  "name": "Präziser Name des Gerichts",
  "calories": 350,
  "protein": 25,
  "carbs": 30,
  "fat": 12,
  "portion": "1 Portion (ca. 200g)",
  "details": "Kurze Aufschlüsselung: Hähnchen 150g, Reis 100g, Gemüse 80g"
}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Analysiere dieses Essen und gib die Nährwerte zurück:' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analysiere dieses Essen und gib die Nährwerte zurück: ${food}`
      });
    }

    console.log('[ANALYZE-FOOD] Calling AI gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYZE-FOOD] AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[ANALYZE-FOOD] Raw response:', content);

    let foodData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[ANALYZE-FOOD] Parse error:', parseError);
      throw new Error('Failed to parse food data');
    }

    console.log('[ANALYZE-FOOD] Successfully analyzed food');

    return new Response(JSON.stringify(foodData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[ANALYZE-FOOD] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
