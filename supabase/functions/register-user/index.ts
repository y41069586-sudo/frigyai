import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? " - " + JSON.stringify(details) : "";
  console.log("[REGISTER-USER] " + step + suffix);
};

function isAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already registered")
  );
}

async function findUserByEmail(
  admin: ReturnType<typeof createClient>["auth"]["admin"],
  email: string,
) {
  let page = 1;
  const perPage = 200;
  const normalized = email.trim().toLowerCase();

  while (page <= 20) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: "Password too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Register", { email });

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!createError && created.user) {
      return new Response(JSON.stringify({ success: true, user_id: created.user.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (createError && isAlreadyRegistered(createError.message)) {
      const existing = await findUserByEmail(supabase.auth.admin, email);
      if (!existing) {
        return new Response(JSON.stringify({ success: false, error: "already_registered" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password,
      });

      if (updateError) {
        logStep("Update existing failed", updateError.message);
        return new Response(JSON.stringify({ success: false, error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, user_id: existing.id, existing: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    logStep("Create failed", createError?.message);
    return new Response(
      JSON.stringify({ success: false, error: createError?.message ?? "Registration failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
