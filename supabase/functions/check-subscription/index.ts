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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      // Update cache: not subscribed
      await updateCache(supabaseClient, user.id, { subscribed: false, product_id: null, subscription_end: null, is_trial: false });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Check for active OR trialing subscriptions
    const [activeSubscriptions, trialingSubscriptions] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 })
    ]);
    
    const subscription = activeSubscriptions.data[0] || trialingSubscriptions.data[0];
    
    if (subscription) {
      const subscriptionEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      const productId = subscription.items.data[0]?.price?.product || null;
      const isTrial = subscription.status === "trialing";
      
      const result = {
        subscribed: true,
        product_id: productId,
        subscription_end: subscriptionEnd,
        is_trial: isTrial
      };
      
      // Update cache
      await updateCache(supabaseClient, user.id, result);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check for successful one-time payments
    const paymentIntents = await stripe.paymentIntents.list({ customer: customerId, limit: 10 });
    const successfulPayment = paymentIntents.data.find((pi: { status: string }) => pi.status === "succeeded");
    
    if (successfulPayment) {
      const result = {
        subscribed: true,
        product_id: "premium_one_time",
        subscription_end: null,
        is_trial: false
      };
      
      // Update cache
      await updateCache(supabaseClient, user.id, result);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Not subscribed
    const result = { subscribed: false, product_id: null, subscription_end: null, is_trial: false };
    await updateCache(supabaseClient, user.id, result);
    
    return new Response(JSON.stringify(result), {
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

async function updateCache(supabase: any, userId: string, data: { subscribed: boolean; product_id: string | null; subscription_end: string | null; is_trial?: boolean }) {
  try {
    await supabase.from('subscription_cache').upsert({
      user_id: userId,
      subscribed: data.subscribed,
      product_id: data.product_id,
      subscription_end: data.subscription_end,
      is_trial: data.is_trial || false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.log('[CHECK-SUBSCRIPTION] Cache update failed', e);
  }
}
