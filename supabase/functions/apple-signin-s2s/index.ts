/**
 * Sign in with Apple — Server-to-Server notifications (account delete, consent revoke).
 * Configure in Apple Developer → Sign in with Apple → Services → your identifier → S2S URL:
 *   https://<project-ref>.supabase.co/functions/v1/apple-signin-s2s
 *
 * Optional reverse proxy: https://app.frigy.app/apple/s2s → same function
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import * as jose from "https://deno.land/x/jose@v4.15.5/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APPLE_JWKS = jose.createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

type AppleS2SEvent = {
  type?: string;
  sub?: string;
  email?: string;
  event_time?: number;
};

async function verifyApplePayload(payloadJwt: string): Promise<AppleS2SEvent> {
  const clientId = Deno.env.get("APPLE_CLIENT_ID")?.trim();
  const verifyOptions: jose.JWTVerifyOptions = {
    issuer: "https://appleid.apple.com",
  };
  if (clientId) {
    verifyOptions.audience = clientId;
  }

  const { payload } = await jose.jwtVerify(payloadJwt, APPLE_JWKS, verifyOptions);
  const events = payload.events as Record<string, AppleS2SEvent> | undefined;
  if (events) {
    const firstKey = Object.keys(events)[0];
    if (firstKey) return events[firstKey] ?? {};
  }
  return payload as AppleS2SEvent;
}

async function findUserIdByAppleSub(
  admin: ReturnType<typeof createClient>,
  appleSub: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) =>
      u.identities?.some(
        (id) => id.provider === "apple" && (id.identity_data as { sub?: string })?.sub === appleSub,
      ),
    );
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function purgeUserData(admin: ReturnType<typeof createClient>, userId: string) {
  await Promise.all([
    admin.from("user_tracker_settings").delete().eq("user_id", userId),
    admin.from("food_entries").delete().eq("user_id", userId),
    admin.from("daily_macros").delete().eq("user_id", userId),
    admin.from("user_streaks").delete().eq("user_id", userId),
    admin.from("water_intake").delete().eq("user_id", userId),
    admin.from("onboarding_data").delete().eq("user_id", userId),
    admin.from("subscription_cache").delete().eq("user_id", userId),
  ]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("APPLE_S2S_WEBHOOK_SECRET")?.trim();
  if (webhookSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${webhookSecret}` && auth !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = await req.json();
    const payloadJwt = typeof body?.payload === "string" ? body.payload : null;
    if (!payloadJwt) {
      return new Response(JSON.stringify({ error: "Missing payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = await verifyApplePayload(payloadJwt);
    const eventType = event.type ?? "";
    const appleSub = event.sub ?? "";

    console.log("[apple-signin-s2s] event:", eventType, "sub:", appleSub?.slice(0, 8));

    if (!appleSub) {
      return new Response(JSON.stringify({ ok: true, skipped: "no sub" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const userId = await findUserIdByAppleSub(admin, appleSub);
    if (!userId) {
      console.log("[apple-signin-s2s] no user for sub");
      return new Response(JSON.stringify({ ok: true, skipped: "user not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (eventType === "account-delete" || eventType === "consent-revoked") {
      await purgeUserData(admin, userId);
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("[apple-signin-s2s] deleteUser failed:", deleteError.message);
        throw deleteError;
      }
      console.log("[apple-signin-s2s] deleted user:", userId);
      return new Response(JSON.stringify({ ok: true, action: "deleted", userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, action: "ignored", eventType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[apple-signin-s2s]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
