import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({ image: z.string().min(1).max(50_000_000) });
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
    
    const { image } = parseResult.data;

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

    console.log("[ANALYZE-INGREDIENTS] Scanning image with deep analysis...");

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
   - Proteine: Fleisch (Hähnchen, Rind, Schwein, Hackfleisch), Fisch, Eier, Tofu, Wurst
   - Milchprodukte: Milch, Butter, Käse (Gouda, Emmentaler, Mozzarella), Joghurt, Sahne, Quark
   - Gemüse: Tomaten, Paprika, Zwiebeln, Knoblauch, Karotten, Gurken, Salat, Brokkoli, Zucchini
   - Obst: Äpfel, Bananen, Orangen, Beeren, Trauben, Zitronen
   - Kohlenhydrate: Nudeln, Reis, Brot, Kartoffeln, Toast
   - Saucen/Gewürze: Ketchup, Senf, Mayo, Pesto, Sojasauce, Öl, Essig
   - Getränke: Saft, Milch, Wasser, Limonade
5. UNSICHERE Produkte mit "(evtl.)" markieren

AUSGABE: Nur ein JSON-Array mit allen erkannten Lebensmitteln auf Deutsch.
Beispiel: ["Hähnchenbrust", "Paprika rot", "Zwiebeln", "Gouda Käse", "Sahne", "Knoblauch", "Olivenöl"]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: "Analysiere dieses Bild im Detail und liste ALLE erkennbaren Lebensmittel auf:" },
            { type: "image_url", image_url: { url: image, detail: "high" } }
          ]}
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("[ANALYZE-INGREDIENTS] AI error:", response.status);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    console.log("[ANALYZE-INGREDIENTS] Response:", content);

    let ingredients: string[] = [];
    try {
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) ingredients = JSON.parse(jsonMatch[0]);
    } catch (e) {
      ingredients = content.replace(/[\[\]"]/g, "").split(",").map((s: string) => s.trim()).filter((s: string) => s);
    }

    let scansRemaining = null;
    if (!isPremium) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabase.from('scan_usage').select('scan_count').eq('user_id', userId).eq('week_start', weekStart).single();
      scansRemaining = FREE_SCAN_LIMIT - (usageData?.scan_count || 0);
    }

    return new Response(JSON.stringify({ ingredients, scansRemaining, isPremium }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[ANALYZE-INGREDIENTS] Error:", error);
    return new Response(JSON.stringify({ error: "Analyse fehlgeschlagen. Bitte erneut versuchen." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
