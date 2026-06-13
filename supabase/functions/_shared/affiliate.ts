import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/** Shared affiliate helpers for Supabase Edge Functions */

export function normalizeSlug(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
}

export function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
}

export type ReferralRow = {
  id: string;
  code: string;
  slug: string | null;
  influencer_name: string | null;
  commission_rate_percent: number;
  active: boolean;
};

export type AffiliateAttributionRow = {
  id: string;
  user_id: string;
  referral_code_id: string;
  affiliate_slug: string;
};

const REFERRAL_SELECT = "id, code, slug, influencer_name, commission_rate_percent, active";

export async function findReferralBySlugOrCode(
  supabase: SupabaseClient,
  raw: string,
): Promise<ReferralRow | null> {
  const slug = normalizeSlug(raw);
  const code = normalizeCode(raw);

  if (slug.length >= 3) {
    const { data } = await supabase
      .from("referral_codes")
      .select(REFERRAL_SELECT)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (data) return data as ReferralRow;
  }

  if (code.length === 6) {
    const { data } = await supabase
      .from("referral_codes")
      .select(REFERRAL_SELECT)
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (data) return data as ReferralRow;
  }

  return null;
}

export async function getAffiliateAttributionForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<AffiliateAttributionRow | null> {
  const { data } = await supabase
    .from("affiliate_attributions")
    .select("id, user_id, referral_code_id, affiliate_slug")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as AffiliateAttributionRow | null) ?? null;
}

export function parseClientReferenceId(ref: string | null | undefined): {
  userId?: string;
  slug?: string;
} {
  if (!ref?.trim()) return {};
  const raw = ref.trim();

  try {
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      return {
        userId: parsed.user_id ?? parsed.userId,
        slug: parsed.ref ? normalizeSlug(String(parsed.ref)) : undefined,
      };
    }
  } catch {
    /* fall through */
  }

  const frigyMatch = raw.match(/^frigy_([a-f0-9-]{8,36})_([a-z0-9]{3,20})$/i);
  if (frigyMatch) {
    return { userId: frigyMatch[1], slug: frigyMatch[2].toLowerCase() };
  }

  const parts = raw.split("|");
  if (parts.length >= 2) {
    return { userId: parts[0], slug: normalizeSlug(parts[1]) };
  }

  if (/^[a-z0-9]{3,20}$/i.test(raw)) {
    return { slug: normalizeSlug(raw) };
  }

  return {};
}

export function calcCommissionCents(amountCents: number, ratePercent: number): number {
  if (amountCents <= 0 || ratePercent <= 0) return 0;
  return Math.round((amountCents * ratePercent) / 100);
}

export function mapRevenueCatStoreToPaymentSource(store: string | null | undefined): string {
  const normalized = String(store ?? "").toUpperCase();
  if (normalized === "APP_STORE") return "app_store";
  if (normalized === "PLAY_STORE") return "play_store";
  if (normalized === "STRIPE") return "stripe";
  return "store";
}

export function revenueCatPriceToCents(event: Record<string, unknown>): number {
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

export function shouldRecordRevenueCatAffiliateCommission(event: Record<string, unknown>): boolean {
  const type = String(event.type ?? "");
  if (!["INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE"].includes(type)) {
    return false;
  }

  const periodType = String(event.period_type ?? "").toUpperCase();
  if (periodType === "TRIAL") return false;

  const amountCents = revenueCatPriceToCents(event);
  if (amountCents <= 0) return false;

  const environment = String(event.environment ?? "PRODUCTION").toUpperCase();
  if (environment === "SANDBOX") return false;

  return true;
}

export async function recordAffiliatePayment(
  supabase: SupabaseClient,
  input: {
    referralCodeId: string;
    userId: string | null;
    affiliateSlug: string;
    paymentEventId: string;
    amountCents: number;
    currency: string;
    commissionRatePercent: number;
    paymentSource?: string;
    storeName?: string | null;
    revenuecatEventId?: string | null;
    stripeSessionId?: string | null;
    stripeInvoiceId?: string | null;
    stripeCustomerId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  const commissionCents = calcCommissionCents(input.amountCents, input.commissionRatePercent);

  const { error } = await supabase.from("affiliate_payments").insert({
    referral_code_id: input.referralCodeId,
    user_id: input.userId,
    affiliate_slug: input.affiliateSlug,
    stripe_event_id: input.paymentEventId,
    stripe_session_id: input.stripeSessionId ?? null,
    stripe_invoice_id: input.stripeInvoiceId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
    amount_cents: input.amountCents,
    currency: input.currency,
    commission_rate_percent: input.commissionRatePercent,
    commission_cents: commissionCents,
    payment_status: "completed",
    commission_status: "pending",
    payment_source: input.paymentSource ?? "stripe",
    store_name: input.storeName ?? null,
    revenuecat_event_id: input.revenuecatEventId ?? null,
    metadata: input.metadata ?? {},
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

  if (input.userId) {
    await supabase
      .from("affiliate_attributions")
      .update({ first_payment_at: new Date().toISOString() })
      .eq("user_id", input.userId)
      .is("first_payment_at", null);
  }

  return true;
}

export async function recordRevenueCatAffiliateCommission(
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
