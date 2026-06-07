import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GRANT-PREMIUM] ${step}${detailsStr}`);
};

// Admin emails that can grant premium
const ADMIN_EMAILS = [
  "yousef0087mohamed@gmail.com",
  "yousef0089mohamed@gmail.com",
];

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
    logStep("Function started");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: adminData, error: adminError } = await supabaseClient.auth.getUser(token);
    
    if (adminError || !adminData.user?.email) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(adminData.user.email.toLowerCase())) {
      logStep("Non-admin attempted access", { email: adminData.user.email });
      return new Response(JSON.stringify({ error: "Keine Admin-Berechtigung" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin authenticated", { adminEmail: adminData.user.email });

    // Parse request body
    const { email, duration_days = 30, reason } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "E-Mail ist erforderlich" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Grant premium blocked (store compliance)", { email, duration_days, reason });

    return new Response(
      JSON.stringify({
        error:
          "Manuelle Premium-Vergabe ist deaktiviert (App Store / Google Play). Nutze Apple Offer Codes oder Google Play Promo Codes.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
