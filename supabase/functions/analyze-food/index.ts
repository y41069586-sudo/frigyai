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

// German to English food translation map
const germanToEnglish: Record<string, string> = {
  'ei': 'egg',
  'eier': 'eggs',
  'milch': 'milk',
  'brot': 'bread',
  'käse': 'cheese',
  'butter': 'butter',
  'joghurt': 'yogurt',
  'apfel': 'apple',
  'äpfel': 'apples',
  'banane': 'banana',
  'bananen': 'bananas',
  'kartoffel': 'potato',
  'kartoffeln': 'potatoes',
  'reis': 'rice',
  'nudeln': 'pasta',
  'hähnchen': 'chicken',
  'hühnchen': 'chicken',
  'huhn': 'chicken',
  'rindfleisch': 'beef',
  'schweinefleisch': 'pork',
  'fisch': 'fish',
  'lachs': 'salmon',
  'thunfisch': 'tuna',
  'tomate': 'tomato',
  'tomaten': 'tomatoes',
  'gurke': 'cucumber',
  'salat': 'salad',
  'spinat': 'spinach',
  'brokkoli': 'broccoli',
  'karotte': 'carrot',
  'karotten': 'carrots',
  'möhre': 'carrot',
  'möhren': 'carrots',
  'zwiebel': 'onion',
  'zwiebeln': 'onions',
  'knoblauch': 'garlic',
  'paprika': 'bell pepper',
  'avocado': 'avocado',
  'nuss': 'nut',
  'nüsse': 'nuts',
  'mandeln': 'almonds',
  'walnüsse': 'walnuts',
  'erdnüsse': 'peanuts',
  'honig': 'honey',
  'zucker': 'sugar',
  'mehl': 'flour',
  'haferflocken': 'oatmeal',
  'müsli': 'muesli',
  'toast': 'toast',
  'schinken': 'ham',
  'wurst': 'sausage',
  'speck': 'bacon',
  'quark': 'quark cheese',
  'sahne': 'cream',
  'olivenöl': 'olive oil',
  'öl': 'oil',
};

// Translate German food terms to English for USDA search
function translateToEnglish(query: string): string {
  // Extract quantity (numbers) and food term
  const match = query.match(/^(\d+\s*)?(.+)$/i);
  if (!match) return query;
  
  const quantity = match[1]?.trim() || '';
  let foodTerm = match[2].trim().toLowerCase();
  
  // Check if the food term exists in our translation map
  if (germanToEnglish[foodTerm]) {
    const translated = germanToEnglish[foodTerm];
    console.log(`[TRANSLATE] "${foodTerm}" -> "${translated}"`);
    return quantity ? `${quantity} ${translated}` : translated;
  }
  
  // Try to find partial matches
  for (const [german, english] of Object.entries(germanToEnglish)) {
    if (foodTerm.includes(german)) {
      const translated = foodTerm.replace(german, english);
      console.log(`[TRANSLATE] "${foodTerm}" -> "${translated}" (partial match)`);
      return quantity ? `${quantity} ${translated}` : translated;
    }
  }
  
  return query;
}

// USDA FoodData Central API integration
async function searchUSDA(query: string): Promise<any | null> {
  const USDA_API_KEY = Deno.env.get('USDA_API_KEY');
  if (!USDA_API_KEY) {
    console.log('[USDA] API key not configured, skipping USDA lookup');
    return null;
  }

  try {
    // Translate German to English for better USDA results
    const translatedQuery = translateToEnglish(query);
    console.log('[USDA] Original query:', query, '-> Translated:', translatedQuery);
    
    // Extract just the food term without quantity for USDA search
    const foodTermMatch = translatedQuery.match(/^\d+\s*(.+)$/i);
    const searchTerm = foodTermMatch ? foodTermMatch[1].trim() : translatedQuery;
    
    console.log('[USDA] Searching for:', searchTerm);
    
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchTerm)}&pageSize=5&dataType=Survey (FNDDS),Foundation,SR Legacy`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      console.error('[USDA] API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[USDA] Found', data.totalHits, 'results');

    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      const nutrients: Record<string, number> = {};
      
      // Extract nutrients from USDA response
      if (food.foodNutrients) {
        for (const nutrient of food.foodNutrients) {
          switch (nutrient.nutrientId) {
            case 1008: // Energy (kcal)
              nutrients.calories = Math.round(nutrient.value || 0);
              break;
            case 1003: // Protein
              nutrients.protein = Math.round(nutrient.value || 0);
              break;
            case 1005: // Carbohydrates
              nutrients.carbs = Math.round(nutrient.value || 0);
              break;
            case 1004: // Total Fat
              nutrients.fat = Math.round(nutrient.value || 0);
              break;
          }
        }
      }

      console.log('[USDA] Extracted nutrients:', nutrients);
      
      // Extract quantity from original query for portion calculation
      const quantityMatch = query.match(/^(\d+)\s*/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      // Adjust nutrients based on quantity (USDA returns per 100g, egg ~50g each)
      const isEgg = searchTerm.toLowerCase().includes('egg');
      const portionMultiplier = isEgg ? (quantity * 50) / 100 : quantity;
      
      return {
        name: food.description,
        protein: Math.round((nutrients.protein || 0) * portionMultiplier),
        carbs: Math.round((nutrients.carbs || 0) * portionMultiplier),
        fat: Math.round((nutrients.fat || 0) * portionMultiplier),
        calories: Math.round((nutrients.calories || 0) * portionMultiplier),
        portion: isEgg ? `${quantity} Ei(er) (ca. ${quantity * 50}g)` : (food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '100g'),
        source: 'USDA FoodData Central',
        fdcId: food.fdcId,
        quantity,
      };
    }

    return null;
  } catch (error) {
    console.error('[USDA] Error:', error);
    return null;
  }
}

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

    // For text-based food lookup, try USDA first
    if (food && !imageBase64) {
      console.log('[ANALYZE-FOOD] Trying USDA lookup first for:', food);
      const usdaResult = await searchUSDA(food);
      
      if (usdaResult && usdaResult.calories && usdaResult.calories > 0) {
        console.log('[ANALYZE-FOOD] Using USDA data:', usdaResult);
        return new Response(JSON.stringify({
          name: usdaResult.name,
          calories: usdaResult.calories,
          protein: usdaResult.protein || 0,
          carbs: usdaResult.carbs || 0,
          fat: usdaResult.fat || 0,
          portion: usdaResult.portion,
          details: `Daten von USDA FoodData Central (FDC ID: ${usdaResult.fdcId})`,
          source: 'usda'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[ANALYZE-FOOD] USDA lookup failed or no results, falling back to AI');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY is not configured');
    }

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
    const openaiOrg = response.headers.get('openai-organization');
    const openaiProject = response.headers.get('openai-project');
    const openaiProcessingMs = response.headers.get('openai-processing-ms');
    console.log('[ANALYZE-FOOD] OpenAI response headers:', {
      requestId,
      openaiOrg,
      openaiProject,
      openaiProcessingMs,
    });
 
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
