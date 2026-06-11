import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserOnboardingRecord = {
  user_id: string;
  onboarding_complete: boolean;
  user_name: string | null;
  created_at?: string;
  updated_at?: string;
};

/** True when a row exists in `user_onboarding` (existing app user). */
export async function hasUserOnboardingRecord(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("user_onboarding")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[userRecord] hasUserOnboardingRecord failed:", error.message);
    return false;
  }

  return data !== null;
}

export async function getUserOnboardingRecord(
  userId: string,
): Promise<UserOnboardingRecord | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_onboarding")
    .select("user_id, onboarding_complete, user_name, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[userRecord] getUserOnboardingRecord failed:", error.message);
    return null;
  }

  return data;
}

/**
 * Ensures `user_onboarding` exists after auth.
 * Returns `isNew: true` when the row was just created (→ paywall).
 * Returns `isNew: false` when the row already existed (→ dashboard).
 */
export async function ensureUserOnboardingRecord(
  user: User,
): Promise<{ isNew: boolean; record: UserOnboardingRecord | null }> {
  const existing = await getUserOnboardingRecord(user.id);
  if (existing) {
    return { isNew: false, record: existing };
  }

  const displayName =
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    null;

  const { data, error } = await supabase
    .from("user_onboarding")
    .upsert(
      {
        user_id: user.id,
        user_name: displayName,
        onboarding_complete: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, onboarding_complete, user_name, created_at, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[userRecord] ensureUserOnboardingRecord failed:", error.message);
    throw error;
  }

  return { isNew: true, record: data };
}

export async function markUserOnboardingComplete(userId: string): Promise<void> {
  const { error } = await supabase.from("user_onboarding").upsert(
    {
      user_id: userId,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[userRecord] markUserOnboardingComplete failed:", error.message);
    throw error;
  }

  localStorage.setItem("onboardingComplete", "true");
}
