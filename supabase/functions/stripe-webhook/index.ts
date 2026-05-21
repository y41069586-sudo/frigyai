import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// --- Affiliate helpers (inlined for single-file Dashboard / CLI deploy) ---

function normalizeSlug(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
}

function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
}

type ReferralRow = {
  id: string;
  code: string;
  slug: string | null;
  influencer_name: string | null;
  commission_rate_percent: number;
  active: boolean;
};

const REFERRAL_SELECT = "id, code, slug, influencer_name, commission_rate_percent, active";

async function findReferralBySlugOrCode(
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

function parseClientReferenceId(ref: string | null | undefined): {
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

function calcCommissionCents(amountCents: number, ratePercent: number): number {
  if (amountCents <= 0 || ratePercent <= 0) return 0;
  return Math.round((amountCents * ratePercent) / 100);
}

async function recordAffiliatePayment(
  supabase: SupabaseClient,
  input: {
    referralCodeId: string;
    userId: string | null;
    affiliateSlug: string;
    stripeEventId: string;
    stripeSessionId?: string | null;
    stripeInvoiceId?: string | null;
    stripeCustomerId?: string | null;
    amountCents: number;
    currency: string;
    commissionRatePercent: number;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  const commissionCents = calcCommissionCents(input.amountCents, input.commissionRatePercent);

  const { error } = await supabase.from("affiliate_payments").insert({
    referral_code_id: input.referralCodeId,
    user_id: input.userId,
    affiliate_slug: input.affiliateSlug,
    stripe_event_id: input.stripeEventId,
    stripe_session_id: input.stripeSessionId ?? null,
    stripe_invoice_id: input.stripeInvoiceId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
    amount_cents: input.amountCents,
    currency: input.currency,
    commission_rate_percent: input.commissionRatePercent,
    commission_cents: commissionCents,
    payment_status: "completed",
    commission_status: "pending",
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

// --- Stripe webhook ---

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? " - " + JSON.stringify(details) : "";
  console.log("[STRIPE-WEBHOOK] " + step + suffix);
};

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>["auth"]["admin"],
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function upsertPremium(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: {
    product_id: string | null;
    subscription_end: string | null;
    is_trial: boolean;
  },
) {
  await supabase.from("subscription_cache").upsert(
    {
      user_id: userId,
      subscribed: true,
      product_id: payload.product_id,
      subscription_end: payload.subscription_end,
      is_trial: payload.is_trial,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

async function loadUserAttribution(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: attr } = await supabase
    .from("affiliate_attributions")
    .select("referral_code_id, affiliate_slug")
    .eq("user_id", userId)
    .maybeSingle();

  if (!attr) return null;

  const { data: code } = await supabase
    .from("referral_codes")
    .select("commission_rate_percent, slug")
    .eq("id", attr.referral_code_id)
    .maybeSingle();

  return {
    referral_code_id: attr.referral_code_id as string,
    affiliate_slug: (attr.affiliate_slug as string) || (code?.slug as string) || "",
    commission_rate_percent: Number(code?.commission_rate_percent ?? 20),
  };
}

async function tagStripeCustomer(
  stripe: Stripe,
  customerId: string,
  meta: Record<string, string>,
) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return;

    const existing = (customer.metadata ?? {}) as Record<string, string>;
    await stripe.customers.update(customerId, {
      metadata: {
        ...existing,
        ...meta,
      },
    });
  } catch (e) {
    logStep("Customer metadata update failed", e);
  }
}

async function processAffiliatePayment(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  params: {
    stripeEventId: string;
    userId: string | null;
    email: string | null;
    amountCents: number;
    currency: string;
    stripeSessionId?: string | null;
    stripeInvoiceId?: string | null;
    stripeCustomerId?: string | null;
    clientReferenceId?: string | null;
    sessionMetadata?: Stripe.Metadata | null;
  },
) {
  if (params.amountCents <= 0) return;

  let referralCodeId: string | null = null;
  let affiliateSlug: string | null = null;
  let commissionRate = 20;

  if (params.userId) {
    const attr = await loadUserAttribution(supabase, params.userId);
    if (attr) {
      referralCodeId = attr.referral_code_id;
      affiliateSlug = attr.affiliate_slug;
      commissionRate = attr.commission_rate_percent;
    }
  }

  const parsedRef = parseClientReferenceId(params.clientReferenceId);
  const metaRef = params.sessionMetadata?.affiliate_ref ??
    params.sessionMetadata?.ref ??
    params.sessionMetadata?.influencer_ref;

  const slugCandidate = parsedRef.slug ?? (metaRef ? String(metaRef) : null);
  if (!referralCodeId && slugCandidate) {
    const partner = await findReferralBySlugOrCode(supabase, slugCandidate);
    if (partner) {
      referralCodeId = partner.id;
      affiliateSlug = partner.slug ?? slugCandidate;
      commissionRate = Number(partner.commission_rate_percent ?? 20);
    }
  }

  if (!referralCodeId || !affiliateSlug) {
    logStep("No affiliate attribution for payment", { email: params.email, userId: params.userId });
    return;
  }

  const recorded = await recordAffiliatePayment(supabase, {
    referralCodeId,
    userId: params.userId,
    affiliateSlug,
    stripeEventId: params.stripeEventId,
    stripeSessionId: params.stripeSessionId,
    stripeInvoiceId: params.stripeInvoiceId,
    stripeCustomerId: params.stripeCustomerId,
    amountCents: params.amountCents,
    currency: params.currency,
    commissionRatePercent: commissionRate,
    metadata: {
      email: params.email,
      client_reference_id: params.clientReferenceId,
    },
  });

  if (recorded && params.stripeCustomerId) {
    await tagStripeCustomer(stripe, params.stripeCustomerId, {
      affiliate_ref: affiliateSlug,
      frigy_user_id: params.userId ?? "",
      affiliate_commission_rate: String(commissionRate),
    });
  }

  logStep("Affiliate payment recorded", {
    affiliateSlug,
    amountCents: params.amountCents,
    commissionRate,
    recorded,
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Webhook not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Signature verification failed", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    logStep("Event", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email =
        session.customer_details?.email ??
        session.customer_email ??
        null;
      const userId = email
        ? await findUserIdByEmail(supabase.auth.admin, email)
        : null;

      let productId: string | null = "stripe_checkout";
      let subscriptionEnd: string | null = null;
      let isTrial = false;

      if (session.subscription && typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        productId = String(sub.items.data[0]?.price?.product ?? "stripe_subscription");
        subscriptionEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        isTrial = sub.status === "trialing";
      }

      if (userId) {
        await upsertPremium(supabase, userId, {
          product_id: productId,
          subscription_end: subscriptionEnd,
          is_trial: isTrial,
        });
        logStep("Premium granted", { userId, email });
      } else {
        logStep("No Supabase user for email", { email });
      }

      const amountCents = session.amount_total ?? 0;
      const customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

      await processAffiliatePayment(supabase, stripe, {
        stripeEventId: event.id,
        userId,
        email,
        amountCents,
        currency: (session.currency ?? "eur").toLowerCase(),
        stripeSessionId: session.id,
        stripeCustomerId: customerId,
        clientReferenceId: session.client_reference_id,
        sessionMetadata: session.metadata,
      });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      let email: string | null = null;

      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (!("deleted" in customer && customer.deleted)) {
          email = customer.email ?? null;
        }
      }

      const productId = String(sub.items.data[0]?.price?.product ?? "stripe_subscription");
      const subscriptionEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
      const isTrial = sub.status === "trialing";

      if (email) {
        const userId = await findUserIdByEmail(supabase.auth.admin, email);
        if (userId) {
          await upsertPremium(supabase, userId, {
            product_id: productId,
            subscription_end: subscriptionEnd,
            is_trial: isTrial,
          });
          logStep("Premium granted (subscription event)", { userId, email });
        }
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const amountCents = invoice.amount_paid ?? 0;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id ?? null;

      let email: string | null = invoice.customer_email ?? null;
      if (!email && customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (!("deleted" in customer && customer.deleted)) {
          email = customer.email ?? null;
        }
      }

      const userId = email ? await findUserIdByEmail(supabase.auth.admin, email) : null;

      await processAffiliatePayment(supabase, stripe, {
        stripeEventId: event.id,
        userId,
        email,
        amountCents,
        currency: (invoice.currency ?? "eur").toLowerCase(),
        stripeInvoiceId: invoice.id,
        stripeCustomerId: customerId,
        clientReferenceId: invoice.metadata?.client_reference_id ?? null,
        sessionMetadata: invoice.metadata,
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (!("deleted" in customer && customer.deleted) && customer.email) {
          const userId = await findUserIdByEmail(supabase.auth.admin, customer.email);
          if (userId) {
            await supabase.from("subscription_cache").upsert(
              {
                user_id: userId,
                subscribed: false,
                product_id: null,
                subscription_end: null,
                is_trial: false,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
            logStep("Subscription removed", { userId });
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Handler error", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
