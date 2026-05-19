import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? " - " + JSON.stringify(details) : "";
  console.log("[REDEEM-REFERRAL] " + step + suffix);
};

function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Nicht angemeldet" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: "Nicht angemeldet" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json().catch(() => ({}));
    const code = normalizeCode(String(body.code ?? ""));

    if (code.length !== 6) {
      return new Response(JSON.stringify({ success: false, error: "Ungültiger Code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Redeem attempt", { userId, code });

    const { data: existing } = await supabase
      .from("referral_redemptions")
      .select("code, redeemed_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          already_redeemed: true,
          code: existing.code,
          message: "Du hast bereits einen Empfehlungscode eingelöst.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: promo, error: promoError } = await supabase
      .from("referral_codes")
      .select("id, code, influencer_name, duration_days, max_redemptions, redemption_count, active, valid_until")
      .eq("code", code)
      .maybeSingle();

    if (promoError || !promo) {
      return new Response(JSON.stringify({ success: false, error: "Code nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!promo.active) {
      return new Response(JSON.stringify({ success: false, error: "Dieser Code ist nicht mehr aktiv" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: "Dieser Code ist abgelaufen" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      promo.max_redemptions != null &&
      promo.redemption_count >= promo.max_redemptions
    ) {
      return new Response(JSON.stringify({ success: false, error: "Code wurde zu oft verwendet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isLifetime = promo.duration_days === 0;
    let subscriptionEndIso: string | null = null;
    if (!isLifetime) {
      const subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + Math.max(1, promo.duration_days));
      subscriptionEndIso = subscriptionEnd.toISOString();
    }

    const { error: cacheError } = await supabase.from("subscription_cache").upsert(
      {
        user_id: userId,
        subscribed: true,
        product_id: "referral_" + promo.code,
        subscription_end: subscriptionEndIso,
        is_trial: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (cacheError) {
      logStep("Cache error", cacheError);
      throw new Error("Premium konnte nicht aktiviert werden");
    }

    const { error: redeemError } = await supabase.from("referral_redemptions").insert({
      user_id: userId,
      referral_code_id: promo.id,
      code: promo.code,
    });

    if (redeemError) {
      logStep("Redemption insert error", redeemError);
      throw new Error("Einlösung konnte nicht gespeichert werden");
    }

    await supabase
      .from("referral_codes")
      .update({ redemption_count: (promo.redemption_count ?? 0) + 1 })
      .eq("id", promo.id);

    logStep("Success", { userId, code, until: subscriptionEndIso, lifetime: isLifetime });

    const message = isLifetime
      ? "Kostenloser Premium-Zugang — lebenslang"
      : "Kostenloser Zugang bis " + new Date(subscriptionEndIso!).toLocaleDateString("de-DE");

    return new Response(
      JSON.stringify({
        success: true,
        code: promo.code,
        influencer_name: promo.influencer_name,
        subscription_end: subscriptionEndIso,
        is_lifetime: isLifetime,
        message,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
