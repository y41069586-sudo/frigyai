import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID")?.trim() || "premium";

// --- Inlined affiliate helpers (Supabase deploys one file per function) ---

type AffiliateAttributionRow = {
  referral_code_id: string;
  affiliate_slug: string;
};

function calcCommissionCents(amountCents: number, ratePercent: number): number {
  if (amountCents <= 0 || ratePercent <= 0) return 0;
  return Math.round((amountCents * ratePercent) / 100);
}

function mapRevenueCatStoreToPaymentSource(store: string | null | undefined): string {
  const normalized = String(store ?? "").toUpperCase();
  if (normalized === "APP_STORE") return "app_store";
  if (normalized === "PLAY_STORE") return "play_store";
  if (normalized === "STRIPE") return "stripe";
  return "store";
}

function revenueCatPriceToCents(event: Record<string, unknown>): number {
  const purchased = event.price_in_purchased_currency;
  const usd = event.price;
  const raw =
    typeof purchased === "number" && purchased > 0
      ? purchased
      : typeof usd === "number" && usd > 0
        ? usd
        : 0;
  return Math.round(raw * 100);
}

function shouldRecordRevenueCatAffiliateCommission(event: Record<string, unknown>): boolean {
  const type = String(event.type ?? "");
  if (!["INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE"].includes(type)) {
    return false;
  }

  const periodType = String(event.period_type ?? "").toUpperCase();
  if (periodType === "TRIAL") return false;

  if (revenueCatPriceToCents(event) <= 0) return false;

  const environment = String(event.environment ?? "PRODUCTION").toUpperCase();
  if (environment === "SANDBOX") return false;

  return true;
}

async function getAffiliateAttributionForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<AffiliateAttributionRow | null> {
  const { data } = await supabase
    .from("affiliate_attributions")
    .select("referral_code_id, affiliate_slug")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as AffiliateAttributionRow | null) ?? null;
}

async function recordAffiliatePayment(
  supabase: SupabaseClient,
  input: {
    referralCodeId: string;
    userId: string;
    affiliateSlug: string;
    paymentEventId: string;
    amountCents: number;
    currency: string;
    commissionRatePercent: number;
    paymentSource: string;
    storeName: string | null;
    revenuecatEventId: string;
    metadata: Record<string, unknown>;
  },
): Promise<boolean> {
  const commissionCents = calcCommissionCents(input.amountCents, input.commissionRatePercent);

  const { error } = await supabase.from("affiliate_payments").insert({
    referral_code_id: input.referralCodeId,
    user_id: input.userId,
    affiliate_slug: input.affiliateSlug,
    stripe_event_id: input.paymentEventId,
    amount_cents: input.amountCents,
    currency: input.currency,
    commission_rate_percent: input.commissionRatePercent,
    commission_cents: commissionCents,
    payment_status: "completed",
    commission_status: "pending",
    payment_source: input.paymentSource,
    store_name: input.storeName,
    revenuecat_event_id: input.revenuecatEventId,
    metadata: input.metadata,
  });

  if (error) {
    if (error.code === "23505") return false;
    throw error;
  }

  const { data: codeRow } = await supabase
    .from("referral_codes")
    .select("total_revenue_cents, total_commission_cents, total_payments")
    .eq("id", input.referralCodeId)
    .single();

  if (codeRow) {
    await supabase
      .from("referral_codes")
      .update({
        total_revenue_cents: Number(codeRow.total_revenue_cents ?? 0) + input.amountCents,
        total_commission_cents: Number(codeRow.total_commission_cents ?? 0) + commissionCents,
        total_payments: Number(codeRow.total_payments ?? 0) + 1,
      })
      .eq("id", input.referralCodeId);
  }

  await supabase
    .from("affiliate_attributions")
    .update({ first_payment_at: new Date().toISOString() })
    .eq("user_id", input.userId)
    .is("first_payment_at", null);

  return true;
}

async function recordRevenueCatAffiliateCommission(
  supabase: SupabaseClient,
  event: Record<string, unknown>,
): Promise<{ recorded: boolean; reason?: string }> {
  if (!shouldRecordRevenueCatAffiliateCommission(event)) {
    return { recorded: false, reason: "skipped_event" };
  }

  const userId = String(event.app_user_id ?? event.original_app_user_id ?? "");
  const eventId = String(event.id ?? "");
  if (!userId || !eventId) {
    return { recorded: false, reason: "missing_ids" };
  }

  const attribution = await getAffiliateAttributionForUser(supabase, userId);
  if (!attribution) {
    return { recorded: false, reason: "no_attribution" };
  }

  const { data: partner } = await supabase
    .from("referral_codes")
    .select("id, commission_rate_percent, active")
    .eq("id", attribution.referral_code_id)
    .maybeSingle();

  if (!partner?.active) {
    return { recorded: false, reason: "inactive_partner" };
  }

  const amountCents = revenueCatPriceToCents(event);
  const currency = String(event.currency ?? "EUR").toLowerCase().slice(0, 8);
  const paymentSource = mapRevenueCatStoreToPaymentSource(event.store as string | undefined);

  const recorded = await recordAffiliatePayment(supabase, {
    referralCodeId: attribution.referral_code_id,
    userId,
    affiliateSlug: attribution.affiliate_slug,
    paymentEventId: `rc_${eventId}`,
    amountCents,
    currency,
    commissionRatePercent: Number(partner.commission_rate_percent ?? 0),
    paymentSource,
    storeName: event.store ? String(event.store) : null,
    revenuecatEventId: eventId,
    metadata: {
      product_id: event.product_id ?? null,
      transaction_id: event.transaction_id ?? null,
      event_type: event.type ?? null,
      period_type: event.period_type ?? null,
      store: event.store ?? null,
    },
  });

  return { recorded, reason: recorded ? undefined : "duplicate" };
}

// --- Webhook handler ---

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
