import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const errorResponse = (code: string, message: string, status: number = 400) => {
  return new Response(
    JSON.stringify({ code, message, status }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[CREATE-CHECKOUT] Function started");

    // Parse request body for billing interval
    let billingInterval = 'monthly';
    try {
      const body = await req.json();
      if (body?.billing_interval) {
        billingInterval = body.billing_interval;
      }
    } catch {
      // No body or invalid JSON, use default
    }
    console.log("[CREATE-CHECKOUT] Billing interval:", billingInterval);

    // Check authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("auth_required", "Authentifizierung erforderlich", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !data.user?.email) {
      console.log("[CREATE-CHECKOUT] Auth failed:", authError?.message);
      return errorResponse("session_expired", "Deine Session ist abgelaufen. Bitte melde dich neu an.", 401);
    }
    
    const user = data.user;
    console.log("[CREATE-CHECKOUT] User authenticated:", user.id, user.email);

    // Stripe Payment Links (configured in your Stripe Dashboard)
    const stripeLinks = {
      monthly: "https://buy.stripe.com/fZu7sLeuccbJ5K2dLx87K08",
      yearly: "https://buy.stripe.com/28EaEXeucejR6O60YL87K07"
    };

    // Select the correct payment link
    const paymentLink = billingInterval === 'yearly' 
      ? stripeLinks.yearly 
      : stripeLinks.monthly;

    console.log("[CREATE-CHECKOUT] Returning payment link:", paymentLink);

    return new Response(
      JSON.stringify({ url: paymentLink }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("[CREATE-CHECKOUT] ERROR:", errorMessage);

    return errorResponse("error", "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.", 500);
  }
});
