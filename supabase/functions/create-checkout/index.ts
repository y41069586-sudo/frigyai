import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Structured error response
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
    logStep("Function started");

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
    logStep("Billing interval", { billingInterval });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No auth header - user needs to login");
      return errorResponse("auth_required", "Authentifizierung erforderlich", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !data.user?.email) {
      logStep("Auth failed - session expired", { error: authError?.message });
      return errorResponse("session_expired", "Deine Session ist abgelaufen. Bitte melde dich neu an.", 401);
    }
    
    const user = data.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
      
      // Check if user already has an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        logStep("User already has active subscription");
        return errorResponse("subscription_exists", "Du hast bereits ein aktives Abonnement", 400);
      }
    }

    // Get proper origin from request
    let origin = req.headers.get("origin");
    if (!origin) {
      origin = req.headers.get("referer")?.split('?')[0].split('#')[0] || "https://frigyai.vercel.app";
    }
    // Ensure origin is clean without trailing slash
    origin = origin.replace(/\/$/, '');

    logStep("Using origin", { origin });

    // Find or create Stripe product
    let productId: string;
    try {
      const products = await stripe.products.list({ limit: 100 });
      const frigProduct = products.data.find(p => p.name === "Frigy Premium");

      if (frigProduct) {
        productId = frigProduct.id;
        logStep("Found existing product", { productId });
      } else {
        const newProduct = await stripe.products.create({
          name: "Frigy Premium",
          description: "Premium access to Frigy AI features",
        });
        productId = newProduct.id;
        logStep("Created new product", { productId });
      }
    } catch (e) {
      throw new Error(`Product creation failed: ${String(e)}`);
    }

    // Find or create price for selected billing interval
    let priceId: string;
    try {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });

      const foundPrice = prices.data.find(p => {
        if (billingInterval === 'yearly') return p.recurring?.interval === 'year';
        if (billingInterval === 'monthly') return p.recurring?.interval === 'month';
        return false;
      });

      if (foundPrice) {
        priceId = foundPrice.id;
        logStep("Found existing price", { priceId, billingInterval });
      } else {
        // Create new price
        const amount = billingInterval === 'yearly' ? 5988 : 999; // in cents: €59.88 or €9.99
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: amount,
          currency: "eur",
          recurring: {
            interval: billingInterval === 'yearly' ? 'year' : 'month',
          },
        });
        priceId = newPrice.id;
        logStep("Created new price", { priceId, billingInterval, amount });
      }
    } catch (e) {
      throw new Error(`Price lookup/creation failed: ${String(e)}`);
    }
    
    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
      },
      success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
      cancel_url: `${origin}/premium-pricing?subscription=cancelled`,
      allow_promotion_codes: true,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, error: String(error) });

    // Provide more specific error messages based on the error type
    let userMessage = "Zahlungsfehler. Bitte überprüfe deine Zahlungsinformationen.";
    let statusCode = 500;

    if (errorMessage.includes("auth") || errorMessage.includes("Auth")) {
      userMessage = "Authentifizierungsfehler. Bitte melde dich erneut an.";
      statusCode = 401;
    } else if (errorMessage.includes("price") || errorMessage.includes("Price")) {
      userMessage = "Preiskonfiguration fehlerhaft. Bitte wende dich an den Support.";
      statusCode = 400;
    } else if (errorMessage.includes("customer") || errorMessage.includes("Customer")) {
      userMessage = "Fehler beim Erstellen des Stripe-Kontos. Bitte versuchen Sie es später erneut.";
      statusCode = 502;
    } else if (errorMessage.includes("Network") || errorMessage.includes("ECONNREFUSED")) {
      userMessage = "Verbindungsfehler zu Zahlungsdienst. Bitte versuchen Sie es später erneut.";
      statusCode = 503;
    }

    return errorResponse("payment_error", userMessage, statusCode);
  }
});
