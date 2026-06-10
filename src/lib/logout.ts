import { clearOnboardingForLogout } from "@/components/onboarding/utils";
import { resetAuthFlow } from "@/lib/authCompletion";
import { clearOnboardingSession } from "@/lib/onboardingSession";
import { clearOAuthPending } from "@/lib/oauthPending";

/** Full sign-out: clear session, onboarding progress, and auth pipeline state. */
export async function performFullLogout(options: {
  signOut: (opts?: { silent?: boolean }) => Promise<void>;
  saveProgress?: (data: { onboarding_complete: boolean }) => Promise<void>;
  silent?: boolean;
}): Promise<void> {
  clearOnboardingForLogout();
  clearOnboardingSession();
  clearOAuthPending();
  resetAuthFlow();

  try {
    await options.saveProgress?.({ onboarding_complete: false });
  } catch {
    /* still sign out if DB update fails */
  }

  await options.signOut({ silent: options.silent ?? true });
}
