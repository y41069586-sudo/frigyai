import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_BASE64_SIZE = 6_700_000;

const requestSchema = z.object({
  food: z.string().min(1).max(500).optional(),
  imageBase64: z.string().max(MAX_BASE64_SIZE).optional(),
}).refine(data => data.food || data.imageBase64, {
  message: "Either 'food' or 'imageBase64' must be provided",
});

async function uploadFoodPhoto(
  supabaseAdmin: any,
  userId: string,
  imageBase64: string
): Promise<string | null> {
  try {
    const imageData = base64Decode(imageBase64);
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    const { error } = await supabaseAdmin.storage
      .from('food-photos')
      .upload(fileName, imageData, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (error) {
      console.error('[ANALYZE-FOOD] Storage upload error:', error);
      return null;
    }
    
    const { data: urlData } = supabaseAdmin.storage
      .from('food-photos')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (err) {
    console.error('[ANALYZE-FOOD] Photo upload failed:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('[ANALYZE-FOOD] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { food, imageBase64 } = parseResult.data;

    // Upload image in background (don't wait)
    let imageUrl: string | null = null;
    const uploadPromise = imageBase64 
      ? uploadFoodPhoto(supabaseAdmin, user.id, imageBase64)
      : Promise.resolve(null);

    console.log('[ANALYZE-FOOD] Analyzing:', food || 'image');

    // Compact system prompt
    const systemPrompt = `Analysiere Essen. Antworte NUR mit JSON:
{"name":"Name mit Menge","calories":123,"protein":10,"carbs":20,"fat":5,"portion":"Portionsangabe"}
Beachte Mengen. Kalorien auf 5er runden. Deutsche Namen.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Analysiere:' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analysiere: ${food}`
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYZE-FOOD] AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte kurz.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI error: ${response.status}`);
    }

    // Wait for image upload while AI was processing
    imageUrl = await uploadPromise;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[ANALYZE-FOOD] Response:', content);

    let foodData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[0]);
        foodData.source = 'ai';
        if (imageUrl) {
          foodData.image_url = imageUrl;
        }
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[ANALYZE-FOOD] Parse error:', parseError);
      throw new Error('Failed to parse food data');
    }

    console.log('[ANALYZE-FOOD] Done:', foodData.name);

    return new Response(JSON.stringify(foodData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[ANALYZE-FOOD] Error:', error);
    return new Response(JSON.stringify({ error: "Analyse fehlgeschlagen. Bitte erneut versuchen." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
