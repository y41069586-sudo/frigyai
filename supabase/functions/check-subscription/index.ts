import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error, returning unsubscribed", { error: userError.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("No user email, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions (trial period counts as premium)
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });
    
    const subscription = activeSubscriptions.data[0] || trialingSubscriptions.data[0];
    
    if (subscription) {
      const subscriptionEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      const productId = subscription.items.data[0]?.price?.product || null;
      const isTrial = subscription.status === "trialing";
      
      logStep("Subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        isTrial,
        endDate: subscriptionEnd, 
        productId 
      });
      
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: productId,
        subscription_end: subscriptionEnd,
        is_trial: isTrial
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    logStep("No active subscription, checking for successful payments");

    // If no subscription, check for successful one-time payments (from payment links)
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
    });
    
    const successfulPayment = paymentIntents.data.find((pi: { status: string }) => pi.status === "succeeded");
    
    if (successfulPayment) {
      logStep("Successful payment found", { paymentId: successfulPayment.id, amount: successfulPayment.amount });
      
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: "premium_one_time",
        subscription_end: null // One-time payment, no end date
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No active subscription or successful payment found");
    
    return new Response(JSON.stringify({
      subscribed: false,
      product_id: null,
      subscription_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
