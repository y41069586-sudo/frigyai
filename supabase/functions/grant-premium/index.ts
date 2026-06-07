import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

/** Recognized as active store entitlement by check-subscription (not legacy influencer_promo). */
const ADMIN_GRANT_PRODUCT_ID = "store_admin_grant";

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GRANT-PREMIUM] ${step}${suffix}`);
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
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

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

    if (!ADMIN_EMAILS.includes(adminData.user.email.toLowerCase())) {
      logStep("Non-admin attempted access", { email: adminData.user.email });
      return new Response(JSON.stringify({ error: "Keine Admin-Berechtigung" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin authenticated", { adminEmail: adminData.user.email });

    const { email, duration_days = 365, reason } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "E-Mail ist erforderlich" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    logStep("Granting premium", { email: normalizedEmail, duration_days, reason });

    const { data: listData, error: listError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      logStep("Error listing users", { error: listError.message });
      throw new Error("Fehler beim Suchen des Nutzers");
    }

    const targetUser = listData.users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (!targetUser) {
      return new Response(JSON.stringify({ error: "Nutzer mit dieser E-Mail nicht gefunden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Found user", { userId: targetUser.id, email: targetUser.email });

    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + Math.max(1, Number(duration_days) || 365));

    const { error: insertError } = await supabaseClient.from("subscription_cache").upsert(
      {
        user_id: targetUser.id,
        subscribed: true,
        product_id: ADMIN_GRANT_PRODUCT_ID,
        subscription_end: subscriptionEnd.toISOString(),
        is_trial: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (insertError) {
      logStep("Error inserting subscription", { error: insertError.message });
      throw new Error("Fehler beim Gewähren von Premium");
    }

    logStep("Premium granted successfully", {
      userId: targetUser.id,
      email: targetUser.email,
      until: subscriptionEnd.toISOString(),
      reason,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Premium wurde gewährt bis ${subscriptionEnd.toLocaleDateString("de-DE")}`,
        user_email: targetUser.email,
        subscription_end: subscriptionEnd.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
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
