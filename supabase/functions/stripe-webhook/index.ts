import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      let email: string | null = null;
      let productId: string | null = null;
      let subscriptionEnd: string | null = null;
      let isTrial = false;

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        email =
          session.customer_details?.email ??
          session.customer_email ??
          null;
        if (session.subscription && typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          productId = String(sub.items.data[0]?.price?.product ?? "stripe_subscription");
          subscriptionEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
          isTrial = sub.status === "trialing";
        } else {
          productId = "stripe_checkout";
        }
      } else {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (!("deleted" in customer && customer.deleted)) {
            email = customer.email ?? null;
          }
        }
        productId = String(sub.items.data[0]?.price?.product ?? "stripe_subscription");
        subscriptionEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        isTrial = sub.status === "trialing";
      }

      if (email) {
        const userId = await findUserIdByEmail(supabase.auth.admin, email);
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
      }
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
