import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Max 10MB for base64 image (roughly 13.3MB in base64 encoding)
const MAX_BASE64_SIZE = 13_300_000;

// Input validation schema
const requestSchema = z.object({
  food: z.string().min(1).max(500).optional(),
  imageBase64: z.string().max(MAX_BASE64_SIZE).optional(),
}).refine(data => data.food || data.imageBase64, {
  message: "Either 'food' or 'imageBase64' must be provided",
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
    
    const { food, imageBase64 } = parseResult.data;

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
    return new Response(JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
