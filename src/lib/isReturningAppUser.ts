import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isEstablishedAuthUser } from "@/lib/isEstablishedAuthUser";
import { isKnownAccountEmail } from "@/lib/knownAccountEmail";
import { isOnboardingInProgress } from "@/lib/onboardingSession";
import { hasEverHadPremium } from "@/lib/trialEligibility";

/**
 * True when this account has used Frigy before (onboarding, subscription, or local completion).
 * Used to send logins to the dashboard instead of the signup paywall.
 */
export async function isReturningAppUser(
  userId: string,
  email?: string | null,
  user?: User | null,
): Promise<boolean> {
  if (!userId) return false;

  if (email && isKnownAccountEmail(email)) return true;
  if (user && isEstablishedAuthUser(user)) return true;

  try {
    if (!isOnboardingInProgress() && localStorage.getItem("onboardingComplete") === "true") {
      return true;
    }
  } catch {
    // ignore
  }

  if (hasEverHadPremium()) return true;

  try {
    const { data: onboarding } = await supabase
      .from("user_onboarding")
      .select("onboarding_complete, user_name, selected_goal")
      .eq("user_id", userId)
      .maybeSingle();

    if (onboarding?.onboarding_complete) return true;

    const { data: sub } = await supabase
      .from("subscription_cache")
      .select("product_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sub?.product_id) return true;
  } catch {
    // ignore — fall through
  }

  return false;
}
