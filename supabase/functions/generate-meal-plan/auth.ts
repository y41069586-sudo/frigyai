import { json } from "./http.ts";

/** Minimal surface used by this function — avoids strict generated DB typings. */
export type SupabaseClient = {
  auth: {
    getUser: (token: string) => Promise<{
      data: { user: { id: string; email?: string | null } | null } | null;
      error: { message?: string } | null;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { subscribed?: boolean; subscription_end?: string | null } | null;
        }>;
      };
    };
  };
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
};

export async function trackMealPlanUsage(supabase: SupabaseClient, userId: string) {
  const ws = weekStart();
  try {
    const { error } = await supabase.rpc("increment_meal_plan_usage", {
      p_user_id: userId,
      p_week_start: ws,
    });
    if (error) console.error("[MEAL-PLAN] usage increment:", error.message);
  } catch (e) {
    console.error("[MEAL-PLAN] usage crash:", e instanceof Error ? e.message : e);
  }
}

export async function isPremium(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  auth: string,
) {
  const { data } = await supabase.from("subscription_cache").select("subscribed, subscription_end").eq("user_id", userId).maybeSingle();
  if (data?.subscribed && (!data.subscription_end || new Date(data.subscription_end) > new Date())) return true;
  const bypass = (Deno.env.get("PREMIUM_BYPASS_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (email && bypass.includes(email.toLowerCase())) return true;
  try {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-subscription`, {
      headers: { Authorization: auth, "Content-Type": "application/json" },
    });
    if (!r.ok) return false;
    const j = await r.json();
    return j?.subscribed === true && (!j.subscription_end || new Date(j.subscription_end) > new Date());
  } catch {
    return false;
  }
}

/** Local Monday YYYY-MM-DD — matches src/lib/localDate.ts getLocalWeekStartISO */
export function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function authFailureMessage(err: { message?: string } | null): string {
  const msg = (err?.message ?? "").toLowerCase();
  if (msg.includes("expired") || msg.includes("jwt expired")) {
    return "Session abgelaufen. Bitte erneut anmelden.";
  }
  if (msg.includes("invalid") || msg.includes("malformed")) {
    return "Ungültige Anmeldung. Bitte erneut anmelden.";
  }
  return "Anmeldung erforderlich. Bitte einloggen.";
}

export async function requireAuthUser(
  supabase: SupabaseClient,
  authHeader: string | null,
): Promise<{ user: { id: string; email?: string | null }; auth: string } | Response> {
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized", message: "Anmeldung erforderlich. Bitte einloggen." }, 401);
  }
  const auth = authHeader.trim();
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ error: "unauthorized", message: "Anmeldung erforderlich. Bitte einloggen." }, 401);
  }

  const { data: authData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr) {
    console.warn("[MEAL-PLAN] auth failed:", authErr.message);
    return json({ error: "unauthorized", message: authFailureMessage(authErr) }, 401);
  }
  if (!authData?.user) {
    return json({ error: "unauthorized", message: "Ungültige Session. Bitte erneut anmelden." }, 401);
  }
  return { user: authData.user, auth };
}
