import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const CANONICAL_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(freiland|bio|frische?)?\s*-?\s*(eier|ei\b|eggs?)\b/i, label: "Eier" },
  { pattern: /\b(voll|magere?|hafer|soja|mandel|kokos|laktosefreie?)?\s*-?\s*milch\b/i, label: "Milch" },
  { pattern: /\b(butter|margarine)\b/i, label: "Butter" },
  { pattern: /\b(natur|griechischer?|frischkäse|quark|joghurt|skyr)\b/i, label: "Joghurt" },
  { pattern: /\b(tomaten?|cherrytomaten)\b/i, label: "Tomaten" },
  { pattern: /\b(gurke|gurken)\b/i, label: "Gurke" },
  { pattern: /\b(zwiebeln?|zwiebel)\b/i, label: "Zwiebel" },
  { pattern: /\b(kartoffeln?|kartoffel)\b/i, label: "Kartoffeln" },
  { pattern: /\b(paprika|peperoni)\b/i, label: "Paprika" },
  { pattern: /\b(käse|mozzarella|gouda|cheddar|parmesan|feta)\b/i, label: "Käse" },
  { pattern: /\b(hähnchen|huhn|puten|hähnchenbrust)\b/i, label: "Hähnchen" },
  { pattern: /\b(rind|rinderhack|hackfleisch|gehacktes)\b/i, label: "Hackfleisch" },
  { pattern: /\b(brot|brötchen|toast|baguette)\b/i, label: "Brot" },
  { pattern: /\b(reis|basmati|jasminreis)\b/i, label: "Reis" },
  { pattern: /\b(nudeln?|pasta|spaghetti|penne)\b/i, label: "Nudeln" },
  { pattern: /\b(äpfel?|apfel)\b/i, label: "Äpfel" },
  { pattern: /\b(bananen?|banane)\b/i, label: "Bananen" },
  { pattern: /\b(salat|kopfsalat|rucola)\b/i, label: "Salat" },
  { pattern: /\b(möhren?|karotten?|mohren)\b/i, label: "Möhren" },
  { pattern: /\b(pilze|champignons?)\b/i, label: "Champignons" },
  { pattern: /\b(wasserflasche|trinkwasser|mineralwasser|stilles\s*wasser|wasser|water|sprudel)\b/i, label: "Wasser" },
  { pattern: /\b(saft|orangensaft|apfelsaft)\b/i, label: "Saft" },
  { pattern: /\b(cornflakes?|müsli|muesli|haferflocken)\b/i, label: "Müsli" },
  { pattern: /\b(kakao|kakaopulver|cocoa)\b/i, label: "Kakaopulver" },
  { pattern: /\b(tee|kräutertee|grüntee)\b/i, label: "Tee" },
  { pattern: /\b(kaffee|espresso|instantkaffee)\b/i, label: "Kaffee" },
  { pattern: /\b(honig|marmelade|nutella|erdnussbutter|peanut butter)\b/i, label: "Aufstrich" },
  { pattern: /\b(öl|olivenöl|sonnenblumenöl|rapsöl)\b/i, label: "Öl" },
  { pattern: /\b(mehl|weizenmehl|dinkelmehl)\b/i, label: "Mehl" },
  { pattern: /\b(zucker|rohrzucker|puderzucker)\b/i, label: "Zucker" },
];

function canonicalizeIngredientLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const { pattern, label } of CANONICAL_RULES) {
    if (pattern.test(lower) || pattern.test(trimmed)) return label;
  }
  if (trimmed.length <= 1) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function dedupeIngredientLabels(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const label = canonicalizeIngredientLabel(raw);
    const key = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

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
    const isOnboarding = body.isOnboarding === true;
    const knownIngredients = Array.isArray(body.knownIngredients)
      ? body.knownIngredients.map((i: unknown) => String(i).trim()).filter(Boolean)
      : [];
    
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

        if (!isPremium && !isOnboarding) {
          return new Response(JSON.stringify({
            error: "premium_required",
            message: "Premium erforderlich für Kühlschrank-Scans.",
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
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

    console.log(`[SCAN] Mode: ${isOnboarding ? 'ONBOARDING' : userId ? 'USER' : 'GUEST'}`);


    // OpenAI Vision - OPTIMIZED
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY fehlt");

    console.log(`[SCAN] Calling OpenAI... | known=${knownIngredients.length} | ${Date.now() - startTotal}ms`);

    const knownHint = knownIngredients.length
      ? `\nBereits auf anderen Fotos erkannt (nicht wiederholen, nur ergänzen): ${knownIngredients.join(", ")}`
      : "";

    const prompt = `Du analysierst Kühlschrank-, Vorrat- oder Essensfotos für eine Einkaufsliste.

Antwort NUR als JSON:
{"ingredients":["Eier","Milch","Cornflakes","Kakaopulver"]}

Regeln:
- Liste JEDES sichtbare Lebensmittel auf Deutsch (Grundform: "Eier", "Milch", "Tomaten", "Cornflakes", "Kakaopulver")
- Auch einzelne Eier, Eierkartons, Packungen, Dosen, Kartons, Schachteln, Tüten, Tupperware, Obst in Schalen
- WICHTIG: Lies Produktnamen von Verpackungen (Cornflakes, Müsli, Kakao, Nudeln, Reis, Mehl, Zucker, Kaffee, Tee, Öl, Gewürze) — auch wenn nur die Vorderseite/Karton sichtbar ist
- Flaschen: Wasser, Mineralwasser, Sprudel, Saft, Milch, Öl, Saucen
- Auch wenn teilweise verdeckt, unscharf oder im Hintergrund — trotzdem auflisten
- Scanne das gesamte Bild systematisch: oben, mitte, unten, links, rechts
- Lieber zu viel listen als etwas Wichtiges weglassen
- Keine Mengenangaben im Namen (nicht "6 Eier", sondern "Eier")
- Kein Text außer dem JSON${knownHint}`;

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image, detail: "high" } }
            ]
          }],
          max_tokens: 1600,
          temperature: 0.15,
          response_format: { type: "json_object" },
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

    // Clean up + canonicalize ingredients
    ingredients = dedupeIngredientLabels(
      ingredients
        .map((i: string) => i.trim())
        .filter((i: string) => i.length > 1 && i.length < 50),
    );

    console.log(`[SCAN] Found ${ingredients.length} ingredients | Total: ${Date.now() - startTotal}ms`);

    return new Response(JSON.stringify({ 
      ingredients,
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
