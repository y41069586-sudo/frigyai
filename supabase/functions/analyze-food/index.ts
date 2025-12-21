import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('[ANALYZE-FOOD] Using OpenAI Vision for:', food || 'image');

    const systemPrompt = `Du bist ein zertifizierter Ernährungsberater mit Expertise in Lebensmittelanalyse und Makronährstoffberechnung.

AUFGABE: Analysiere das Essen präzise und berechne die Nährwerte basierend auf wissenschaftlichen Datenbanken.

ANALYSE-METHODE:
1. Identifiziere das Lebensmittel und die Menge (z.B. "2 Eier", "1 Scheibe Brot")
2. Berücksichtige Zubereitungsart (roh, gekocht, gebraten - beeinflusst Kaloriengehalt)
3. Berechne Makros basierend auf der angegebenen Menge

NÄHRWERT-REFERENZEN (pro 100g roh/Standard):
- Ei (1 Stück, ca. 60g): 93 kcal, 8g P, 0.6g K, 7g F
- Hähnchenbrust (gekocht): 165 kcal, 31g P, 0g K, 3.6g F
- Reis (gekocht): 130 kcal, 2.7g P, 28g K, 0.3g F
- Lachs (gebraten): 208 kcal, 20g P, 0g K, 13g F
- Avocado: 160 kcal, 2g P, 9g K, 15g F
- Olivenöl (1 EL = 14g): 124 kcal, 0g P, 0g K, 14g F
- Brokkoli (gekocht): 35 kcal, 2.8g P, 7g K, 0.4g F
- Kartoffeln (gekocht): 77 kcal, 2g P, 17g K, 0.1g F
- Vollkornbrot (1 Scheibe = 50g): 110 kcal, 5g P, 20g K, 1.5g F
- Milch 1.5% (100ml): 47 kcal, 3.4g P, 4.9g K, 1.5g F
- Toast (1 Scheibe = 25g): 65 kcal, 2g P, 12g K, 1g F
- Joghurt natur (100g): 61 kcal, 3.5g P, 4.7g K, 3.3g F
- Käse Gouda (30g Scheibe): 105 kcal, 7.5g P, 0g K, 8.5g F
- Haferflocken (40g): 150 kcal, 5g P, 24g K, 3g F
- Banane (1 mittel, 120g): 107 kcal, 1.3g P, 27g K, 0.4g F

WICHTIGE REGELN:
- Beachte die MENGE im Input (z.B. "2 Eier" = 2x Einzelwerte)
- Runde Kalorien auf 5er-Schritte
- Protein, Kohlenhydrate, Fett auf ganze Zahlen
- Bei Unklarheit: Schätze konservativ

Antworte NUR mit validem JSON in diesem Format:
{
  "name": "Präziser Name (z.B. 2 Eier gekocht)",
  "calories": 186,
  "protein": 16,
  "carbs": 1,
  "fat": 14,
  "portion": "2 Eier (ca. 120g)",
  "details": "Pro Ei: 93 kcal, 8g Protein, 7g Fett"
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

    console.log('[ANALYZE-FOOD] Calling OpenAI Vision API...');
 
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
      }),
    });

    const requestId = response.headers.get('x-request-id');
    console.log('[ANALYZE-FOOD] OpenAI response:', { requestId, status: response.status });
 
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYZE-FOOD] OpenAI API error:', response.status, { requestId, errorText });
      throw new Error(`OpenAI API error: ${response.status}`);
    }
 
    const data = await response.json();
    console.log('[ANALYZE-FOOD] OpenAI usage:', { requestId, usage: data?.usage });

    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[ANALYZE-FOOD] Raw response:', content);

    let foodData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[0]);
        foodData.source = 'ai';
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[ANALYZE-FOOD] Parse error:', parseError);
      throw new Error('Failed to parse food data');
    }

    console.log('[ANALYZE-FOOD] Successfully analyzed:', foodData.name);

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
