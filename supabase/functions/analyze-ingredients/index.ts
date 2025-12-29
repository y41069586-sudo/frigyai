import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({ 
  image: z.string().min(1).max(50_000_000),
  shoppingList: z.array(z.string()).optional(), // Einkaufsliste zum Abgleich
});
const FREE_SCAN_LIMIT = 1;

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Auth erforderlich" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: userData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !userData.user) return new Response(JSON.stringify({ error: "Ungültiger Token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const parseResult = requestSchema.safeParse(await req.json());
    if (!parseResult.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const { image, shoppingList } = parseResult.data;

    // Check premium
    let isPremium = false;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (userEmail && stripeKey) {
      try {
        const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
          isPremium = subs.data.length > 0;
        }
      } catch (e) { console.error("Stripe error:", e); }
    }

    // Check limits
    if (!isPremium) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabase.from('scan_usage').select('scan_count').eq('user_id', userId).eq('week_start', weekStart).single();
      const currentCount = usageData?.scan_count || 0;

      if (currentCount >= FREE_SCAN_LIMIT) {
        return new Response(JSON.stringify({ error: "scan_limit_exceeded", message: "Wöchentlicher Scan erreicht. Premium für unbegrenzte Scans!", scansUsed: currentCount, scansLimit: FREE_SCAN_LIMIT }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (usageData) {
        await supabase.from('scan_usage').update({ scan_count: currentCount + 1, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('week_start', weekStart);
      } else {
        await supabase.from('scan_usage').insert({ user_id: userId, scan_date: new Date().toISOString().split('T')[0], week_start: weekStart, scan_count: 1 });
      }
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    console.log("[ANALYZE-INGREDIENTS] Starting scan for user:", userId);
    console.log("[ANALYZE-INGREDIENTS] Shopping list items:", shoppingList?.length || 0);
    console.log("[ANALYZE-INGREDIENTS] Image size:", Math.round(image.length / 1024), "KB");

    const systemPrompt = `Du bist ein EXTREM PRÄZISER Lebensmittel-Scanner im TIEFENANALYSE-MODUS.

AUFGABE: Analysiere das Bild und liste JEDES EINZELNE Lebensmittel auf.

ERKENNUNGSREGELN:
1. SCHAUE GENAU HIN - auch teilweise verdeckte Produkte zählen
2. LIES ALLE ETIKETTEN und Markennamen (z.B. "Philadelphia Frischkäse" statt nur "Frischkäse")
3. ERKENNE VERPACKUNGSTYPEN:
   - Flaschen (Saft, Milch, Sauce, Öl, Wasser)
   - Dosen (Tomaten, Bohnen, Mais, Thunfisch)
   - Gläser (Marmelade, Senf, Gewürze, Pesto)
   - Tüten (Nudeln, Reis, Chips, Brot)
   - Boxen/Kartons (Eier, Milch, Müsli)
   - Plastikschalen (Fleisch, Wurst, Käse, Salat)
   - Frischware ohne Verpackung (Obst, Gemüse)
4. KATEGORISIERE ALLES:
   - Proteine: Fleisch, Fisch, Eier, Tofu, Wurst
   - Milchprodukte: Milch, Butter, Käse, Joghurt, Sahne, Quark
   - Gemüse: Tomaten, Paprika, Zwiebeln, Knoblauch, Karotten, Gurken, Salat
   - Obst: Äpfel, Bananen, Orangen, Beeren
   - Kohlenhydrate: Nudeln, Reis, Brot, Kartoffeln
   - Saucen/Gewürze: Ketchup, Senf, Mayo, Pesto, Öl, Essig
   - Getränke: Saft, Milch, Wasser
5. SCHÄTZE MENGEN ein (z.B. "ca. 500g", "1 Packung", "3 Stück")
6. UNSICHERE Produkte mit "(evtl.)" markieren

AUSGABE: JSON mit dieser Struktur:
{
  "ingredients": ["Zutat 1", "Zutat 2"],
  "ingredientsWithQuantity": [
    {"name": "Hähnchenbrust", "quantity": "ca. 400g", "confidence": "high"},
    {"name": "Paprika rot", "quantity": "2 Stück", "confidence": "high"},
    {"name": "Sahne", "quantity": "1 Becher", "confidence": "medium"}
  ],
  "confidenceLevel": "high/medium/low"
}`;

    const startTime = Date.now();
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout (edge function limit is 60s)

    let aiResponse: Response;
    try {
      console.log("[ANALYZE-INGREDIENTS] Calling OpenAI Vision API...");
      
      aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: [
              { type: "text", text: "Analysiere dieses Bild im Detail und liste ALLE erkennbaren Lebensmittel auf:" },
              { type: "image_url", image_url: { url: image, detail: "low" } } // "low" for faster response
            ]}
          ],
          max_tokens: 800,
        }),
      });

      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("[ANALYZE-INGREDIENTS] Request timed out after 55s");
        return new Response(JSON.stringify({ 
          error: "timeout", 
          message: "Analyse dauerte zu lange. Bitte mit besserem Licht erneut versuchen.",
          ingredients: [],
          ingredientsWithQuantity: [],
          confidenceLevel: "low"
        }), { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      throw fetchError;
    }

    const elapsed = Date.now() - startTime;
    console.log("[ANALYZE-INGREDIENTS] OpenAI response in", elapsed, "ms, status:", aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[ANALYZE-INGREDIENTS] AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "rate_limit", 
          message: "Zu viele Anfragen. Bitte warte kurz." 
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    console.log("[ANALYZE-INGREDIENTS] AI Content:", content.substring(0, 300));

    let ingredients: string[] = [];
    let ingredientsWithQuantity: any[] = [];
    let confidenceLevel = "medium";
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        ingredients = parsed.ingredients || [];
        ingredientsWithQuantity = parsed.ingredientsWithQuantity || [];
        confidenceLevel = parsed.confidenceLevel || "medium";
        console.log("[ANALYZE-INGREDIENTS] Parsed", ingredients.length, "ingredients");
      }
    } catch (e) {
      console.log("[ANALYZE-INGREDIENTS] JSON parse failed, trying fallback...");
      // Fallback: Parse as simple array
      const arrayMatch = content.match(/\[.*\]/s);
      if (arrayMatch) {
        ingredients = JSON.parse(arrayMatch[0]);
      } else {
        ingredients = content.replace(/[\[\]"]/g, "").split(",").map((s: string) => s.trim()).filter((s: string) => s);
      }
      console.log("[ANALYZE-INGREDIENTS] Fallback found", ingredients.length, "ingredients");
    }

    // Einkaufslisten-Abgleich
    let shoppingListMatches: string[] = [];
    if (shoppingList && shoppingList.length > 0) {
      const ingredientsLower = ingredients.map(i => i.toLowerCase());
      
      shoppingListMatches = shoppingList.filter(item => {
        const itemLower = item.toLowerCase();
        return ingredientsLower.some(ing => 
          ing.includes(itemLower) || itemLower.includes(ing)
        );
      });
      
      console.log("[ANALYZE-INGREDIENTS] Shopping list matches:", shoppingListMatches);
    }

    let scansRemaining = null;
    if (!isPremium) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabase.from('scan_usage').select('scan_count').eq('user_id', userId).eq('week_start', weekStart).single();
      scansRemaining = FREE_SCAN_LIMIT - (usageData?.scan_count || 0);
    }

    return new Response(JSON.stringify({ 
      ingredients, 
      ingredientsWithQuantity,
      confidenceLevel,
      scansRemaining, 
      isPremium,
      shoppingListMatches, // Gefundene Einkaufslisten-Items
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[ANALYZE-INGREDIENTS] Error:", error);
    return new Response(JSON.stringify({ error: "Analyse fehlgeschlagen. Bitte erneut versuchen." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
