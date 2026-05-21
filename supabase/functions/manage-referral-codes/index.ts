import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const REFERRAL_ADMIN_EMAILS = [
  "yousef0087mohamed@gmail.com",
  "yousef0089mohamed@gmail.com",
];

function isReferralAdminEmail(email: string): boolean {
  return REFERRAL_ADMIN_EMAILS.includes(email.toLowerCase());
}

function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
}

function normalizeSlug(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
}

function isLifetimeDuration(durationDays: unknown, lifetimeFlag?: unknown): boolean {
  return lifetimeFlag === true || Number(durationDays) === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isReferralAdminEmail(userData.user.email)) {
      return new Response(JSON.stringify({ error: "Keine Berechtigung" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");

    if (action === "list") {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("id, code, slug, influencer_name, commission_rate_percent, total_revenue_cents, total_commission_cents, total_payments, duration_days, max_redemptions, redemption_count, active, valid_until, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, codes: data ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const code = normalizeCode(String(body.code ?? ""));
      if (code.length !== 6) {
        return new Response(JSON.stringify({ error: "Code muss genau 6 Zeichen haben" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const lifetime = isLifetimeDuration(body.duration_days, body.lifetime);
      const durationDays = lifetime ? 0 : Math.max(1, Number(body.duration_days) || 30);
      const maxRedemptions = body.max_redemptions == null || body.max_redemptions === ""
        ? null
        : Math.max(1, Number(body.max_redemptions));

      const slugRaw = String(body.slug ?? "").trim();
      const slug = slugRaw ? normalizeSlug(slugRaw) : null;
      if (slug && slug.length < 3) {
        return new Response(JSON.stringify({ error: "Slug mindestens 3 Zeichen" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const commissionRate = body.commission_rate_percent == null
        ? 20
        : Math.min(100, Math.max(0, Number(body.commission_rate_percent)));

      const { data, error } = await supabase
        .from("referral_codes")
        .insert({
          code,
          slug,
          influencer_name: String(body.influencer_name ?? "").trim() || null,
          commission_rate_percent: commissionRate,
          duration_days: durationDays,
          max_redemptions: maxRedemptions,
          active: body.active !== false,
        })
        .select()
        .single();

      if (error) {
        const msg = error.code === "23505" ? "Dieser Code existiert bereits" : error.message;
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, code: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle") {
      const id = String(body.id ?? "");
      const active = Boolean(body.active);
      if (!id) {
        return new Response(JSON.stringify({ error: "ID fehlt" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("referral_codes").update({ active }).eq("id", id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unbekannte Aktion" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
