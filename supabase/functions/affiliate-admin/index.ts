import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

function normalizeSlug(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const REFERRAL_ADMIN_EMAIL = "yousef0087mohamed@gmail.com";

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

    if (userData.user.email.toLowerCase() !== REFERRAL_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Keine Berechtigung" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "revenue_report");

    if (action === "revenue_report") {
      const { data: partners, error } = await supabase
        .from("referral_codes")
        .select(
          "id, code, slug, influencer_name, commission_rate_percent, total_revenue_cents, total_commission_cents, total_payments, redemption_count, active",
        )
        .order("total_revenue_cents", { ascending: false });

      if (error) throw error;

      const { data: recentPayments } = await supabase
        .from("affiliate_payments")
        .select(
          "id, affiliate_slug, amount_cents, commission_cents, commission_status, currency, created_at, user_id",
        )
        .order("created_at", { ascending: false })
        .limit(50);

      const totals = (partners ?? []).reduce(
        (acc, p) => ({
          revenue_cents: acc.revenue_cents + Number(p.total_revenue_cents ?? 0),
          commission_cents: acc.commission_cents + Number(p.total_commission_cents ?? 0),
          payments: acc.payments + Number(p.total_payments ?? 0),
        }),
        { revenue_cents: 0, commission_cents: 0, payments: 0 },
      );

      return new Response(
        JSON.stringify({
          success: true,
          totals,
          partners: partners ?? [],
          recent_payments: recentPayments ?? [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "mark_commission_paid") {
      const paymentId = String(body.payment_id ?? "");
      if (!paymentId) {
        return new Response(JSON.stringify({ error: "payment_id fehlt" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("affiliate_payments")
        .update({ commission_status: "paid" })
        .eq("id", paymentId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_partner") {
      const id = String(body.id ?? "");
      if (!id) {
        return new Response(JSON.stringify({ error: "id fehlt" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};
      if (body.commission_rate_percent != null) {
        updates.commission_rate_percent = Math.min(100, Math.max(0, Number(body.commission_rate_percent)));
      }
      if (body.slug != null) {
        const slug = normalizeSlug(String(body.slug));
        if (slug.length >= 3) updates.slug = slug;
      }
      if (body.influencer_name != null) {
        updates.influencer_name = String(body.influencer_name).trim() || null;
      }

      const { error } = await supabase.from("referral_codes").update(updates).eq("id", id);
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
