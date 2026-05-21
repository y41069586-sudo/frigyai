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

    logStep("Granting premium", { email, duration_days, reason });

    const { data: userByEmail, error: userError } = await supabaseClient.auth.admin.getUserByEmail(
      email.trim(),
    );

    if (userError) {
      logStep("Error looking up user", { error: userError.message });
      throw new Error("Fehler beim Suchen des Nutzers");
    }

    const targetUser = userByEmail?.user;

    if (!targetUser) {
      return new Response(JSON.stringify({ error: "Nutzer mit dieser E-Mail nicht gefunden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Found user", { userId: targetUser.id, email: targetUser.email });

    // Calculate subscription end date
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + duration_days);

    // Insert or update subscription_cache
    const { error: insertError } = await supabaseClient
      .from('subscription_cache')
      .upsert({
        user_id: targetUser.id,
        subscribed: true,
        product_id: 'influencer_promo',
        subscription_end: subscriptionEnd.toISOString(),
        is_trial: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (insertError) {
      logStep("Error inserting subscription", { error: insertError.message });
      throw new Error("Fehler beim Gewähren von Premium");
    }

    logStep("Premium granted successfully", { 
      userId: targetUser.id, 
      email: targetUser.email,
      until: subscriptionEnd.toISOString(),
      reason 
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Premium wurde gewährt bis ${subscriptionEnd.toLocaleDateString('de-DE')}`,
      user_email: targetUser.email,
      subscription_end: subscriptionEnd.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
