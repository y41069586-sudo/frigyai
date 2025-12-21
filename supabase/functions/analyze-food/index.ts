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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth header for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[ANALYZE-FOOD] No auth header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for user verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[ANALYZE-FOOD] Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ANALYZE-FOOD] User authenticated:', user.id);

    const body = await req.json();
    
    // Validate input
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("[ANALYZE-FOOD] Validation error:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { food, imageBase64 } = parseResult.data;

    // Use Lovable AI Gateway - no API key needed!
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[ANALYZE-FOOD] LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ANALYZE-FOOD] Analyzing:', food || 'image');

    const systemPrompt = `Du bist ein zertifizierter Ernährungsberater mit Expertise in Lebensmittelanalyse und Makronährstoffberechnung.

SPRACHE & GEMISCHTE EINGABEN:
- Erkenne automatisch die Hauptsprache (Deutsch/Englisch)
- Verstehe gemischte Eingaben wie "2 eggs mit Butter" oder "Hähnchen with rice"
- Antworte immer auf DEUTSCH, unabhängig von der Eingabesprache
- Übersetze englische Begriffe intern für die korrekte Berechnung

ÜBERSETZUNGSHILFE (Englisch → Deutsch):
Proteine: egg/eggs=Ei/Eier, chicken=Hähnchen, beef=Rind, pork=Schwein, fish=Fisch, salmon=Lachs, tuna=Thunfisch, shrimp=Garnelen, turkey=Pute, bacon=Speck, ham=Schinken, steak=Steak, meatball=Frikadelle
Kohlenhydrate: rice=Reis, pasta/noodles=Nudeln, bread=Brot, potato=Kartoffel, oatmeal/oats=Haferflocken, toast=Toast, roll=Brötchen, cereal=Müsli, pancake=Pfannkuchen, waffle=Waffel
Milch: milk=Milch, cheese=Käse, yogurt=Joghurt, butter=Butter, cream=Sahne, cottage cheese=Hüttenkäse, cream cheese=Frischkäse
Obst: apple=Apfel, banana=Banane, orange=Orange, strawberry=Erdbeere, grape=Traube, blueberry=Heidelbeere, watermelon=Wassermelone, peach=Pfirsich, pear=Birne, mango=Mango
Gemüse: salad=Salat, tomato=Tomate, cucumber=Gurke, broccoli=Brokkoli, spinach=Spinat, carrot=Karotte, pepper=Paprika, onion=Zwiebel, garlic=Knoblauch, mushroom=Pilz, corn=Mais, peas=Erbsen, beans=Bohnen
Sonstiges: chocolate=Schokolade, cake=Kuchen, cookie=Keks, ice cream=Eis, coffee=Kaffee, juice=Saft, oil=Öl, sugar=Zucker, honey=Honig, peanut butter=Erdnussbutter, nuts=Nüsse, avocado=Avocado

AUFGABE: Analysiere das Essen EXAKT und berechne die Nährwerte basierend auf den unten stehenden Referenzdaten.

ANALYSE-REGELN:
1. IMMER die Menge aus der Eingabe verwenden (z.B. "2 Eier" = 2x Einzelwerte)
2. Zubereitungsart beachten (roh vs. gekocht ändert Gewicht um ~10-15%)
3. Bei Portionsangaben wie "1 Portion" oder "1 Teller" realistische Mengen schätzen
4. Runde Kalorien auf 5er-Schritte, Makros auf ganze Zahlen

DEUTSCHE NÄHRWERT-REFERENZEN (pro 100g wenn nicht anders angegeben):

=== EIER & MILCHPRODUKTE ===
Ei (1 Stück = 55-60g): 85-93 kcal, 7-8g P, 0.5g K, 6-7g F
Eiweiß (1 Ei = 33g): 17 kcal, 4g P, 0g K, 0g F
Eigelb (1 Ei = 17g): 55 kcal, 2.5g P, 0.3g K, 5g F
Joghurt natur 3.5%: 61 kcal, 3.5g P, 4.7g K, 3.3g F
Joghurt fettarm 1.5%: 47 kcal, 4g P, 5g K, 1.5g F
Quark Mager: 67 kcal, 12g P, 4g K, 0.3g F
Quark 20%: 102 kcal, 12g P, 3g K, 5g F
Quark 40%: 143 kcal, 11g P, 3g K, 10g F
Skyr: 63 kcal, 11g P, 4g K, 0.2g F
Milch Vollmilch 3.5%: 64 kcal, 3.3g P, 4.7g K, 3.5g F
Milch 1.5%: 47 kcal, 3.4g P, 4.9g K, 1.5g F
Käse Gouda (1 Scheibe = 25-30g): 90-110 kcal, 6-8g P, 0g K, 7-9g F
Käse Emmentaler: 382 kcal, 28g P, 0g K, 30g F
Käse Parmesan: 392 kcal, 36g P, 0g K, 26g F
Käse Mozzarella: 255 kcal, 19g P, 1g K, 19g F
Butter: 741 kcal, 0.7g P, 0.6g K, 83g F
Sahne 30%: 292 kcal, 2.4g P, 3.2g K, 30g F

=== FLEISCH & FISCH (gegart) ===
Hähnchenbrust: 165 kcal, 31g P, 0g K, 3.6g F
Hähnchenschenkel: 177 kcal, 26g P, 0g K, 8g F
Hackfleisch gemischt: 252 kcal, 20g P, 0g K, 19g F
Hackfleisch Rind: 212 kcal, 21g P, 0g K, 14g F
Rindersteak: 201 kcal, 28g P, 0g K, 10g F
Schweinefilet: 143 kcal, 24g P, 0g K, 5g F
Schweinekotelett: 232 kcal, 25g P, 0g K, 14g F
Bratwurst (1 Stück = 100g): 301 kcal, 12g P, 1g K, 27g F
Wiener/Frankfurter (1 Stück = 50g): 128 kcal, 6g P, 0.5g K, 11g F
Lachs: 208 kcal, 20g P, 0g K, 13g F
Thunfisch (Dose in Wasser): 108 kcal, 24g P, 0g K, 1g F
Forelle: 135 kcal, 20g P, 0g K, 6g F
Garnelen: 99 kcal, 21g P, 0g K, 1g F

=== BEILAGEN & KOHLENHYDRATE ===
Reis gekocht: 130 kcal, 2.7g P, 28g K, 0.3g F
Nudeln gekocht: 131 kcal, 4.5g P, 25g K, 0.8g F
Kartoffeln gekocht: 77 kcal, 2g P, 17g K, 0.1g F
Pommes Frites: 291 kcal, 3.4g P, 38g K, 14g F
Brot Vollkorn (1 Scheibe = 40-50g): 90-110 kcal, 4-5g P, 18-20g K, 1-2g F
Brot Weißbrot (1 Scheibe = 30-40g): 75-100 kcal, 2-3g P, 15-18g K, 1g F
Toast (1 Scheibe = 25g): 65 kcal, 2g P, 12g K, 1g F
Brötchen (1 Stück = 50g): 140 kcal, 4g P, 28g K, 1g F
Croissant (1 Stück = 60g): 270 kcal, 5g P, 27g K, 16g F
Haferflocken (40g Portion): 150 kcal, 5g P, 24g K, 3g F
Müsli mit Milch (1 Portion): 200-250 kcal, 7g P, 35g K, 5g F

=== GEMÜSE ===
Salat/Blattsalat: 14 kcal, 1.2g P, 2g K, 0.2g F
Tomaten: 18 kcal, 0.9g P, 3g K, 0.2g F
Gurke: 12 kcal, 0.6g P, 2g K, 0.1g F
Paprika: 26 kcal, 1g P, 5g K, 0.3g F
Brokkoli gekocht: 35 kcal, 2.8g P, 7g K, 0.4g F
Spinat: 23 kcal, 2.9g P, 3.6g K, 0.4g F
Zucchini: 17 kcal, 1.2g P, 2g K, 0.3g F
Karotten gekocht: 35 kcal, 0.8g P, 7g K, 0.3g F
Erbsen gekocht: 84 kcal, 6.7g P, 14g K, 0.4g F
Bohnen grün: 25 kcal, 1.8g P, 4g K, 0.2g F

=== OBST ===
Apfel (1 mittel = 150g): 78 kcal, 0.5g P, 19g K, 0.3g F
Banane (1 mittel = 120g): 107 kcal, 1.3g P, 27g K, 0.4g F
Orange (1 mittel = 180g): 85 kcal, 1.7g P, 19g K, 0.4g F
Erdbeeren: 32 kcal, 0.8g P, 6g K, 0.4g F
Trauben: 67 kcal, 0.6g P, 15g K, 0.3g F
Heidelbeeren: 42 kcal, 0.7g P, 8g K, 0.5g F
Wassermelone: 30 kcal, 0.6g P, 8g K, 0.2g F

=== FETTE & ÖLE ===
Olivenöl (1 EL = 14g): 124 kcal, 0g P, 0g K, 14g F
Butter (1 EL = 12g): 89 kcal, 0.1g P, 0.1g K, 10g F
Rapsöl (1 EL = 14g): 124 kcal, 0g P, 0g K, 14g F
Margarine: 722 kcal, 0.2g P, 0.4g K, 80g F
Avocado (1/2 = 80g): 128 kcal, 1.6g P, 7.2g K, 12g F
Nüsse gemischt: 607 kcal, 18g P, 13g K, 54g F
Mandeln: 576 kcal, 21g P, 6g K, 49g F
Walnüsse: 654 kcal, 15g P, 14g K, 65g F
Erdnüsse: 567 kcal, 26g P, 16g K, 49g F
Erdnussbutter (1 EL = 15g): 94 kcal, 4g P, 3g K, 8g F

=== SÜSSES & SNACKS ===
Schokolade Vollmilch: 535 kcal, 7.3g P, 54g K, 32g F
Schokolade Zartbitter 70%: 530 kcal, 8g P, 33g K, 42g F
Gummibärchen: 343 kcal, 7g P, 77g K, 0.5g F
Chips: 536 kcal, 6g P, 50g K, 35g F
Kekse: 480 kcal, 6g P, 65g K, 22g F
Eis (1 Kugel = 50g): 100 kcal, 2g P, 12g K, 5g F
Kuchen/Torte (1 Stück): 250-400 kcal, 4g P, 40g K, 15g F
Honig (1 TL = 7g): 21 kcal, 0g P, 5.7g K, 0g F
Zucker (1 TL = 5g): 20 kcal, 0g P, 5g K, 0g F
Marmelade (1 TL = 10g): 26 kcal, 0g P, 6g K, 0g F

=== GETRÄNKE ===
Cola (250ml): 105 kcal, 0g P, 27g K, 0g F
Orangensaft (250ml): 113 kcal, 1.8g P, 25g K, 0.5g F
Apfelsaft (250ml): 118 kcal, 0.3g P, 29g K, 0.3g F
Bier (500ml): 215 kcal, 2.5g P, 17g K, 0g F
Wein (150ml): 120 kcal, 0.1g P, 3g K, 0g F
Cappuccino (250ml): 85 kcal, 4g P, 7g K, 4g F
Latte Macchiato (350ml): 140 kcal, 7g P, 12g K, 7g F

=== DEUTSCHE GERICHTE (typische Portion) ===
Schnitzel paniert (200g): 450 kcal, 32g P, 15g K, 30g F
Currywurst mit Pommes: 800 kcal, 22g P, 65g K, 48g F
Döner Kebab (1 Stück): 650 kcal, 30g P, 55g K, 35g F
Pizza Margherita (1/2): 450 kcal, 15g P, 50g K, 20g F
Burger (1 Stück): 500 kcal, 25g P, 35g K, 28g F
Spaghetti Bolognese (1 Portion): 550 kcal, 25g P, 60g K, 20g F
Käsespätzle (1 Portion): 650 kcal, 22g P, 55g K, 38g F
Bratkartoffeln (200g): 220 kcal, 4g P, 30g K, 10g F
Gulasch (250g): 350 kcal, 35g P, 8g K, 20g F
Frikadelle (1 Stück = 100g): 240 kcal, 15g P, 8g K, 17g F

BEISPIELBERECHNUNGEN:
- "2 Eier" → 2 × 90 kcal = 180 kcal, 2 × 7.5g = 15g P
- "1 Scheibe Brot mit Butter und Käse" → 100 + 90 + 100 = 290 kcal
- "Haferflocken mit Milch (250ml)" → 150 + 160 = 310 kcal

Antworte NUR mit validem JSON in diesem Format:
{
  "name": "Präziser deutscher Name mit Menge",
  "calories": 180,
  "protein": 15,
  "carbs": 1,
  "fat": 13,
  "portion": "2 Eier (ca. 110g)",
  "details": "Pro Ei: ~90 kcal, 7.5g Protein, 6.5g Fett"
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

    console.log('[ANALYZE-FOOD] Calling Lovable AI Gateway...');
 
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

    console.log('[ANALYZE-FOOD] AI response status:', response.status);
 
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYZE-FOOD] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-Service nicht verfügbar.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }
 
    const data = await response.json();
    console.log('[ANALYZE-FOOD] AI usage:', data?.usage);

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
