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
          data: {
            subscribed?: boolean;
            subscription_end?: string | null;
            product_id?: string | null;
          } | null;
        }>;
      };
    };
  };
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
};

type SubscriptionCacheRow = {
  subscribed?: boolean;
  subscription_end?: string | null;
  product_id?: string | null;
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

function isPromoProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return productId.startsWith("referral_") || productId === "influencer_promo";
}

function isStoreProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return productId.startsWith("rc_") || productId.startsWith("store_");
}

function isOneTimeProductId(productId: string | null | undefined): boolean {
  return productId === "premium_one_time";
}

function promoStillValid(subscriptionEnd: string | null | undefined): boolean {
  if (!subscriptionEnd) return true;
  return new Date(subscriptionEnd) > new Date();
}

function premiumFromCacheRow(row: SubscriptionCacheRow | null | undefined): boolean {
  if (!row?.subscribed) return false;

  if (isPromoProductId(row.product_id)) {
    return promoStillValid(row.subscription_end);
  }

  if (isOneTimeProductId(row.product_id)) {
    return true;
  }

  if (isStoreProductId(row.product_id)) {
    if (row.subscription_end && new Date(row.subscription_end) <= new Date()) return false;
    return true;
  }

  if (!row.subscription_end) return true;
  return new Date(row.subscription_end) > new Date();
}

async function loadSubscriptionCache(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionCacheRow | null> {
  const { data } = await supabase
    .from("subscription_cache")
    .select("subscribed, subscription_end, product_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function isPremium(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  auth: string,
) {
  let cache = await loadSubscriptionCache(supabase, userId);
  if (premiumFromCacheRow(cache)) {
    console.log("[MEAL-PLAN] premium: cache hit", { product_id: cache?.product_id });
    return true;
  }

  const bypass = (Deno.env.get("PREMIUM_BYPASS_EMAILS") || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (email && bypass.includes(email.toLowerCase())) {
    console.log("[MEAL-PLAN] premium: bypass email");
    return true;
  }

  try {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-subscription`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await r.text();
    let parsed: SubscriptionCacheRow & { error?: string } = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      console.warn("[MEAL-PLAN] check-subscription non-JSON", text.slice(0, 120));
    }

    if (parsed.subscribed === true && premiumFromCacheRow(parsed)) {
      console.log("[MEAL-PLAN] premium: check-subscription active");
      return true;
    }

    if (!r.ok) {
      console.warn("[MEAL-PLAN] check-subscription HTTP", r.status, parsed.error ?? "");
      cache = await loadSubscriptionCache(supabase, userId);
      if (premiumFromCacheRow(cache)) {
        console.log("[MEAL-PLAN] premium: cache after check-subscription error", {
          product_id: cache?.product_id,
        });
        return true;
      }
    } else {
      cache = await loadSubscriptionCache(supabase, userId);
      if (premiumFromCacheRow(cache)) {
        console.log("[MEAL-PLAN] premium: cache after refresh", { product_id: cache?.product_id });
        return true;
      }
    }
  } catch (e) {
    console.warn("[MEAL-PLAN] check-subscription failed:", e instanceof Error ? e.message : e);
    cache = await loadSubscriptionCache(supabase, userId);
    if (premiumFromCacheRow(cache)) return true;
  }

  console.warn("[MEAL-PLAN] premium: denied", { userId, email: email ?? null });
  return false;
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
