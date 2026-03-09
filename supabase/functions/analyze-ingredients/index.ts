import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const FREE_SCAN_LIMIT = 0;

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTotal = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, 
      { auth: { persistSession: false } }
    );

    // Parse request first
    const body = await req.json();
    const image = body.image;
    const isOnboarding = body.isOnboarding === true; // Flag for onboarding scan
    
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: "Kein Bild" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[SCAN] Image: ${Math.round(image.length / 1024)}KB | Onboarding: ${isOnboarding}`);

    // Auth check - OPTIONAL for onboarding
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isPremium = false;

    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const { data: userData, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      
      if (!authError && userData.user) {
        userId = userData.user.id;
        console.log(`[SCAN] Logged in user: ${userId} | Auth: ${Date.now() - startTotal}ms`);

        // Check premium status for logged-in users
        const { data: cacheData } = await supabase
          .from('subscription_cache')
          .select('subscribed, subscription_end')
          .eq('user_id', userId)
          .maybeSingle();

        // Premium if subscribed is true AND (no end date OR end date is in the future)
        // OR if it's the admin/owner email
        if (cacheData?.subscribed) {
          isPremium = !cacheData.subscription_end || new Date(cacheData.subscription_end) > new Date();
        }

        // Owner/Admin override
        if (!isPremium && userData.user.email?.toLowerCase() === 'yousef0089mohamed@gmail.com') {
          isPremium = true;
          console.log(`[SCAN] Owner override premium access for ${userData.user.email}`);
        }

        console.log(`[SCAN] Premium: ${isPremium} | Check: ${Date.now() - startTotal}ms`);

        // Limit check for logged-in free users (not during onboarding)
        if (!isPremium && !isOnboarding) {
          const weekStart = getWeekStart();
          const { data: usageData } = await supabase
            .from('scan_usage')
            .select('scan_count')
            .eq('user_id', userId)
            .eq('week_start', weekStart)
            .maybeSingle();
          
          const currentCount = usageData?.scan_count || 0;

          if (currentCount >= FREE_SCAN_LIMIT) {
            return new Response(JSON.stringify({ 
              error: "scan_limit_exceeded", 
              message: "Wöchentlicher Scan erreicht. Premium für unbegrenzte Scans!",
              scansUsed: currentCount,
              scansLimit: FREE_SCAN_LIMIT 
            }), { 
              status: 429, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
          }

          // Increment usage
          if (usageData) {
            await supabase.from('scan_usage')
              .update({ scan_count: currentCount + 1, updated_at: new Date().toISOString() })
              .eq('user_id', userId)
              .eq('week_start', weekStart);
          } else {
            await supabase.from('scan_usage').insert({ 
              user_id: userId, 
              scan_date: new Date().toISOString().split('T')[0], 
              week_start: weekStart, 
              scan_count: 1 
            });
          }
        }
      }
    }

    // Guest onboarding scan - allowed without login
    if (!userId && !isOnboarding) {
      return new Response(JSON.stringify({ error: "Auth erforderlich" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[SCAN] Mode: ${isOnboarding ? 'ONBOARDING (FREE)' : userId ? 'USER' : 'GUEST'}`);


    // OpenAI Vision - OPTIMIZED
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY fehlt");

    console.log(`[SCAN] Calling OpenAI... | ${Date.now() - startTotal}ms`);

    // OPTIMIZED PROMPT - Short & Direct
    const prompt = `Scan dieses Kühlschrank/Essen-Foto. Liste ALLE sichtbaren Lebensmittel auf deutsch.

Antwort NUR als JSON:
{"ingredients":["Zutat1","Zutat2","Zutat3"]}

Regeln:
- Jedes einzelne Lebensmittel auflisten
- Kurze Namen (Milch, Eier, Butter, Käse, Tomaten...)
- Bei Unsicherheit trotzdem auflisten
- KEIN Text außer dem JSON`;

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image, detail: "auto" } }
            ]
          }],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });
    } catch (e: any) {
      throw e;
    }

    const apiTime = Date.now() - startTotal;
    console.log(`[SCAN] OpenAI response: ${response.status} | ${apiTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SCAN] OpenAI error: ${response.status} ${errorText}`);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "rate_limit", 
          message: "Zu viele Anfragen. Warte kurz." 
        }), { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      throw new Error(`OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log(`[SCAN] Response: ${content.substring(0, 200)}`);

    // Parse ingredients with safer JSON extraction
    let ingredients: string[] = [];
    try {
      // Try direct parse first
      const parsed = JSON.parse(content);
      ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    } catch (e) {
      // Safer extraction: find first { and last }
      const trimmed = content.trim();
      const startIdx = trimmed.indexOf('{');
      const endIdx = trimmed.lastIndexOf('}');

      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        try {
          const jsonStr = trimmed.substring(startIdx, endIdx + 1);
          const parsed = JSON.parse(jsonStr);
          ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
        } catch (jsonErr) {
          console.warn(`[SCAN] JSON parse failed:`, jsonErr);
        }
      }

      // If JSON parsing failed, try to extract ingredients from list format
      if (ingredients.length === 0) {
        const listMatch = content.match(/\[([^\]]+)\]/);
        if (listMatch) {
          ingredients = listMatch[1]
            .split(',')
            .map((s: string) => s.replace(/["\s]/g, '').trim())
            .filter((s: string) => s.length > 0);
        }
      }
    }

    // Clean up ingredients
    ingredients = ingredients
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 1 && i.length < 50);

    console.log(`[SCAN] Found ${ingredients.length} ingredients | Total: ${Date.now() - startTotal}ms`);

    // Get remaining scans for free users (only if logged in)
    let scansRemaining = null;
    if (!isPremium && userId) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabase
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();
      scansRemaining = FREE_SCAN_LIMIT - (usageData?.scan_count || 0);
    }

    return new Response(JSON.stringify({ 
      ingredients,
      scansRemaining,
      isPremium,
      responseTime: Date.now() - startTotal
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error(`[SCAN] Error: ${error.message}`);
    return new Response(JSON.stringify({ 
      error: "Analyse fehlgeschlagen",
      message: error.message,
      ingredients: []
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
