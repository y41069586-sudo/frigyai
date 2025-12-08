import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_SCAN_LIMIT = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check authentication
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isPremium = false;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData.user?.id || null;
      const userEmail = userData.user?.email;

      // Check if user has premium subscription via Stripe
      if (userEmail) {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          try {
            const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            
            if (customers.data.length > 0) {
              const subscriptions = await stripe.subscriptions.list({
                customer: customers.data[0].id,
                status: "active",
                limit: 1,
              });
              isPremium = subscriptions.data.length > 0;
            }
          } catch (stripeError) {
            console.error("Stripe check error:", stripeError);
          }
        }
      }
    }

    // Check scan limits for non-premium users
    if (userId && !isPremium) {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's scan count
      const { data: usageData } = await supabaseClient
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('scan_date', today)
        .single();

      const currentCount = usageData?.scan_count || 0;

      if (currentCount >= FREE_SCAN_LIMIT) {
        console.log(`User ${userId} exceeded free scan limit (${currentCount}/${FREE_SCAN_LIMIT})`);
        return new Response(
          JSON.stringify({ 
            error: "scan_limit_exceeded",
            message: "Du hast dein tägliches Scan-Limit erreicht. Upgrade auf Premium für unbegrenzte Scans!",
            scansUsed: currentCount,
            scansLimit: FREE_SCAN_LIMIT
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Increment scan count
      if (usageData) {
        await supabaseClient
          .from('scan_usage')
          .update({ scan_count: currentCount + 1 })
          .eq('user_id', userId)
          .eq('scan_date', today);
      } else {
        await supabaseClient
          .from('scan_usage')
          .insert({ user_id: userId, scan_date: today, scan_count: 1 });
      }

      console.log(`User ${userId} scan count: ${currentCount + 1}/${FREE_SCAN_LIMIT}`);
    }

    console.log("Analyzing image for ingredients...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte für Lebensmittelerkennung und Kühlschrankorganisation.

AUFGABE: Identifiziere ALLE sichtbaren Lebensmittel im Bild präzise.

ERKENNUNGS-REGELN:
1. Sei SPEZIFISCH: Nicht "Käse", sondern "Gouda", "Mozzarella", "Parmesan"
2. Unterscheide Varianten: "Hähnchenbrust", "Hackfleisch", "Lachs-Filet"
3. Beachte Verpackungen: Lies Beschriftungen wenn sichtbar
4. Mengen ignorieren: Liste nur die Zutat, nicht die Menge
5. Frische vs. Verarbeitet: "Frische Tomaten" vs "Tomatenmark"

KATEGORIEN zum Achten:
- Proteine: Fleisch, Fisch, Eier, Tofu, Hülsenfrüchte
- Milchprodukte: Milch, Joghurt (0%, 1.5%, griechisch), Käsesorten, Quark
- Gemüse: Frisch, TK, Konserven
- Obst: Frisch, TK
- Kohlenhydrate: Brot, Nudeln, Reis, Kartoffeln
- Fette: Butter, Öle, Avocado
- Würzmittel: Senf, Ketchup, Saucen

Antworte NUR mit einem JSON-Array auf Deutsch:
["Hähnchenbrust", "Griechischer Joghurt 0%", "Frische Tomaten", "Mozzarella", "Eier"]`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this refrigerator image and identify all food ingredients you can see. List them in German."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", content);

    // Parse the JSON array from the response
    let ingredients: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Error parsing ingredients:", e);
      // Fallback: split by commas and clean up
      ingredients = content
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }

    // Return remaining scans info for free users
    let scansRemaining = null;
    if (userId && !isPremium) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await supabaseClient
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('scan_date', today)
        .single();
      
      scansRemaining = FREE_SCAN_LIMIT - (usageData?.scan_count || 0);
    }

    return new Response(
      JSON.stringify({ 
        ingredients,
        scansRemaining,
        isPremium
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-ingredients:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});