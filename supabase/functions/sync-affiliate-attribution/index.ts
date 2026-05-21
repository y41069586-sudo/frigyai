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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "auth_required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "invalid_session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawRef = String(body.slug ?? body.ref ?? "");
    const slug = normalizeSlug(rawRef);
    if (slug.length < 3) {
      return new Response(JSON.stringify({ error: "invalid_ref" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const partner = await findReferralBySlugOrCode(supabase, slug);
    if (!partner) {
      return new Response(JSON.stringify({ error: "partner_not_found", slug }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const source = String(body.source ?? "deep_link").slice(0, 40);
    const deferred = Boolean(body.deferred);

    const { data: existing } = await supabase
      .from("affiliate_attributions")
      .select("id, affiliate_slug, referral_code_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          attributed: false,
          slug: existing.affiliate_slug,
          message: "already_attributed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: insertError } = await supabase.from("affiliate_attributions").insert({
      user_id: userId,
      referral_code_id: partner.id,
      affiliate_slug: partner.slug ?? slug,
      source,
      deferred,
    });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        attributed: true,
        slug: partner.slug ?? slug,
        influencer_name: partner.influencer_name,
        commission_rate_percent: partner.commission_rate_percent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
