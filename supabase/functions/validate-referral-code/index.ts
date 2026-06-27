import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

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
    const body = await req.json().catch(() => ({}));
    const raw = String(body.code ?? body.ref ?? body.slug ?? "");
    const slug = normalizeSlug(raw);
    const code = normalizeCode(raw);

    if (slug.length < 3 && code.length !== 6) {
      return new Response(JSON.stringify({ valid: false, error: "Ungültiger Code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const partner = await findReferralBySlugOrCode(supabase, raw);
    if (!partner) {
      return new Response(JSON.stringify({ valid: false, error: "Code nicht gefunden" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: promo, error } = await supabase
      .from("referral_codes")
      .select("code, slug, influencer_name, duration_days, active, valid_until, max_redemptions, redemption_count")
      .eq("id", partner.id)
      .maybeSingle();

    if (error || !promo) {
      return new Response(JSON.stringify({ valid: false, error: "Code nicht gefunden" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!promo.active) {
      return new Response(JSON.stringify({ valid: false, error: "Code nicht aktiv" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Code abgelaufen" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      promo.max_redemptions != null &&
      promo.redemption_count >= promo.max_redemptions
    ) {
      return new Response(JSON.stringify({ valid: false, error: "Code ausgeschöpft" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isLifetime = promo.duration_days === 0;

    return new Response(
      JSON.stringify({
        valid: true,
        code: promo.code,
        slug: promo.slug,
        influencer_name: promo.influencer_name,
        duration_days: promo.duration_days,
        is_lifetime: isLifetime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ valid: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
