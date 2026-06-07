import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID")?.trim() || "premium";

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? " - " + JSON.stringify(details) : "";
  console.log("[CHECK-SUBSCRIPTION] " + step + suffix);
};

type SubscriptionResult = {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  is_trial: boolean;
};

type RcSubscriber = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        expires_date: string | null;
        product_identifier?: string;
        period_type?: string;
      }
    >;
  };
};

function isPromoProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return productId.startsWith("referral_") || productId === "influencer_promo";
}

function isStoreProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return productId.startsWith("rc_") || productId.startsWith("store_");
}

function cacheEntryStillValid(subscriptionEnd: string | null): boolean {
  if (!subscriptionEnd) return true;
  return new Date(subscriptionEnd) > new Date();
}

function mapRcToResult(data: RcSubscriber): SubscriptionResult {
  const ent = data.subscriber?.entitlements?.[ENTITLEMENT_ID];
  if (!ent) {
    return {
      subscribed: false,
      product_id: null,
      subscription_end: null,
      is_trial: false,
    };
  }

  const expires = ent.expires_date;
  const stillValid = !expires || new Date(expires) > new Date();

  return {
    subscribed: stillValid,
    product_id: ent.product_identifier ? `rc_${ent.product_identifier}` : "rc_premium",
    subscription_end: expires,
    is_trial: ent.period_type === "trial",
  };
}

async function updateCache(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  data: SubscriptionResult,
) {
  try {
    await supabase.from("subscription_cache").upsert(
      {
        user_id: userId,
        subscribed: data.subscribed,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        is_trial: data.is_trial || false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch (e) {
    console.log("[CHECK-SUBSCRIPTION] Cache update failed", e);
  }
}

async function loadAnyActiveFromCache(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<SubscriptionResult | null> {
  const { data, error } = await supabase
    .from("subscription_cache")
    .select("subscribed, product_id, subscription_end, is_trial")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.subscribed) {
    return null;
  }
  if (isPromoProductId(data.product_id)) {
    return null;
  }
  if (!cacheEntryStillValid(data.subscription_end)) {
    return null;
  }

  return {
    subscribed: true,
    product_id: data.product_id,
    subscription_end: data.subscription_end,
    is_trial: data.is_trial || false,
  };
}

async function loadActiveStoreFromCache(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<SubscriptionResult | null> {
  const { data, error } = await supabase
    .from("subscription_cache")
    .select("subscribed, product_id, subscription_end, is_trial")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.subscribed || !isStoreProductId(data.product_id)) {
    return null;
  }
  if (!cacheEntryStillValid(data.subscription_end)) {
    return null;
  }

  return {
    subscribed: true,
    product_id: data.product_id,
    subscription_end: data.subscription_end,
    is_trial: data.is_trial || false,
  };
}

async function fetchFromRevenueCat(userId: string): Promise<SubscriptionResult | null> {
  const rcSecret = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!rcSecret) {
    logStep("REVENUECAT_SECRET_API_KEY not set — skipping live RC fetch");
    return null;
  }

  try {
    const rcRes = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${rcSecret}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!rcRes.ok) {
      logStep("RevenueCat fetch failed", { status: rcRes.status });
      return null;
    }

    const rcJson = (await rcRes.json()) as RcSubscriber;
    return mapRcToResult(rcJson);
  } catch (e) {
    logStep("RevenueCat fetch error", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

const NOT_SUBSCRIBED: SubscriptionResult = {
  subscribed: false,
  product_id: null,
  subscription_end: null,
  is_trial: false,
};

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
      return new Response(JSON.stringify(NOT_SUBSCRIBED), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify(NOT_SUBSCRIBED), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const rcLive = await fetchFromRevenueCat(user.id);
    if (rcLive?.subscribed) {
      logStep("Active subscription from RevenueCat", rcLive);
      await updateCache(supabaseClient, user.id, rcLive);
      return new Response(JSON.stringify(rcLive), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const activeStore = await loadActiveStoreFromCache(supabaseClient, user.id);
    if (activeStore) {
      logStep("Active App Store / Play subscription from cache", activeStore);
      return new Response(JSON.stringify(activeStore), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (rcLive && !rcLive.subscribed) {
      const cachedActive = await loadAnyActiveFromCache(supabaseClient, user.id);
      if (cachedActive) {
        logStep("Keeping active subscription from cache (RC reports inactive)", cachedActive);
        return new Response(JSON.stringify(cachedActive), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("RevenueCat reports no active entitlement");
      await updateCache(supabaseClient, user.id, rcLive);
      return new Response(JSON.stringify(rcLive), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const cachedActive = await loadAnyActiveFromCache(supabaseClient, user.id);
    if (cachedActive) {
      logStep("Active subscription from cache (RC unavailable)", cachedActive);
      return new Response(JSON.stringify(cachedActive), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    await updateCache(supabaseClient, user.id, NOT_SUBSCRIBED);

    return new Response(JSON.stringify(NOT_SUBSCRIBED), {
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
