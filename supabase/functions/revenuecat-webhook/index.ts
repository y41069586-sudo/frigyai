import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { recordRevenueCatAffiliateCommission } from "../_shared/affiliate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID")?.trim() || "premium";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const auth = req.headers.get("Authorization");
  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (expected && auth !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const event = (body?.event ?? {}) as Record<string, unknown>;
    const appUserId = event?.app_user_id ?? event?.original_app_user_id;
    if (!appUserId || typeof appUserId !== "string") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const entitlements = event?.entitlement_ids as string[] | undefined;
    const hasPremium = Array.isArray(entitlements)
      ? entitlements.includes(ENTITLEMENT_ID)
      : Boolean(event?.entitlement_id === ENTITLEMENT_ID);

    const expirationAt = event?.expiration_at_ms
      ? new Date(Number(event.expiration_at_ms)).toISOString()
      : null;

    const subscribed = hasPremium && (!expirationAt || new Date(expirationAt) > new Date());
    const productId = event?.product_id ? `rc_${event.product_id}` : subscribed ? "rc_premium" : null;
    const isTrial = event?.period_type === "TRIAL" || event?.period_type === "trial";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    await supabase.from("subscription_cache").upsert(
      {
        user_id: appUserId,
        subscribed,
        product_id: productId,
        subscription_end: expirationAt,
        is_trial: isTrial,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    let affiliate: { recorded: boolean; reason?: string } = { recorded: false };
    try {
      affiliate = await recordRevenueCatAffiliateCommission(supabase, event);
      if (affiliate.recorded) {
        console.log("[revenuecat-webhook] affiliate commission recorded", {
          userId: appUserId,
          eventId: event.id,
          type: event.type,
        });
      }
    } catch (affiliateError) {
      console.error("[revenuecat-webhook] affiliate commission failed:", affiliateError);
    }

    return new Response(JSON.stringify({ ok: true, affiliate }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[revenuecat-webhook]", e);
    return new Response(JSON.stringify({ error: "webhook_failed" }), { status: 500 });
  }
});
