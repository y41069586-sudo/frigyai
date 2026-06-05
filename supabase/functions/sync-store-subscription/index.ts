import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID")?.trim() || "premium";

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

function mapRcToCache(data: RcSubscriber) {
  const ent = data.subscriber?.entitlements?.[ENTITLEMENT_ID];
  if (!ent) {
    return {
      subscribed: false,
      product_id: null as string | null,
      subscription_end: null as string | null,
      is_trial: false,
    };
  }

  const expires = ent.expires_date;
  const stillValid = !expires || new Date(expires) > new Date();
  const isTrial = ent.period_type === "trial";

  return {
    subscribed: stillValid,
    product_id: ent.product_identifier ? `rc_${ent.product_identifier}` : "rc_premium",
    subscription_end: expires,
    is_trial: isTrial,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rcSecret = Deno.env.get("REVENUECAT_SECRET_API_KEY");
    if (!rcSecret) {
      return new Response(JSON.stringify({ error: "REVENUECAT_SECRET_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${rcSecret}`,
        "Content-Type": "application/json",
      },
    });

    if (!rcRes.ok) {
      const text = await rcRes.text();
      console.error("[sync-store-subscription] RevenueCat error:", rcRes.status, text);

      const { data: cached } = await supabase
        .from("subscription_cache")
        .select("subscribed, product_id, subscription_end, is_trial")
        .eq("user_id", userId)
        .maybeSingle();

      if (cached?.subscribed) {
        const fallback = {
          subscribed: true,
          product_id: cached.product_id,
          subscription_end: cached.subscription_end,
          is_trial: cached.is_trial || false,
        };
        return new Response(JSON.stringify(fallback), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "revenuecat_fetch_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rcJson = (await rcRes.json()) as RcSubscriber;
    const cache = mapRcToCache(rcJson);

    await supabase.from("subscription_cache").upsert(
      {
        user_id: userId,
        subscribed: cache.subscribed,
        product_id: cache.product_id,
        subscription_end: cache.subscription_end,
        is_trial: cache.is_trial,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return new Response(JSON.stringify(cache), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[sync-store-subscription]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
