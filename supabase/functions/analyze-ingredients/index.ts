import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Max ~50MB for base64/URL image data
const MAX_IMAGE_SIZE = 50_000_000;

// Input validation schema
const requestSchema = z.object({
  image: z.string().min(1).max(MAX_IMAGE_SIZE),
});

const FREE_SCAN_LIMIT = 1; // 1 scan per week for free users

// Helper to get the start of the current week (Monday)
const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client first for auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // SECURITY: Check authentication BEFORE any processing
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentifizierung erforderlich. Bitte melde dich an." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Ungültiger Token. Bitte melde dich erneut an." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    console.log("User authenticated:", userId);

    // Now parse and validate input
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { image } = parseResult.data;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Check if user has premium subscription via Stripe
    let isPremium = false;
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

    // Check scan limits for non-premium users (1 scan per WEEK)
    if (!isPremium) {
      const weekStart = getWeekStart();
      
      // Get this week's scan count
      const { data: usageData } = await supabaseClient
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single();

      const currentCount = usageData?.scan_count || 0;

      if (currentCount >= FREE_SCAN_LIMIT) {
        console.log(`User ${userId} exceeded free weekly scan limit (${currentCount}/${FREE_SCAN_LIMIT})`);
        return new Response(
          JSON.stringify({ 
            error: "scan_limit_exceeded",
            message: "Du hast deinen wöchentlichen Scan erreicht. Upgrade auf Premium für unbegrenzte Scans!",
            scansUsed: currentCount,
            scansLimit: FREE_SCAN_LIMIT
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Increment scan count for this week
      if (usageData) {
        await supabaseClient
          .from('scan_usage')
          .update({ scan_count: currentCount + 1, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('week_start', weekStart);
      } else {
        await supabaseClient
          .from('scan_usage')
          .insert({ user_id: userId, scan_date: new Date().toISOString().split('T')[0], week_start: weekStart, scan_count: 1 });
      }

      console.log(`User ${userId} weekly scan count: ${currentCount + 1}/${FREE_SCAN_LIMIT}`);
    }

    console.log("Analyzing image for ingredients using OpenAI Vision...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
        max_tokens: 1000,
      }),
    });

    const requestId = response.headers.get("x-request-id");
    const openaiOrg = response.headers.get("openai-organization");
    const openaiProject = response.headers.get("openai-project");
    const openaiProcessingMs = response.headers.get("openai-processing-ms");
    console.log("OpenAI response headers:", {
      requestId,
      openaiOrg,
      openaiProject,
      openaiProcessingMs,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, { requestId, errorText });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenAI usage:", { requestId, usage: data?.usage });

    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("OpenAI response:", content);

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

    // Return remaining scans info for free users (weekly)
    let scansRemaining = null;
    if (userId && !isPremium) {
      const weekStart = getWeekStart();
      const { data: usageData } = await supabaseClient
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
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
      JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
