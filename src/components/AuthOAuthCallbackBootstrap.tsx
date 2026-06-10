import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isOAuthCallbackUrl, isOAuthErrorUrl } from "@/lib/authOAuth";
import { handleOAuthCallbackUrl } from "@/lib/completeOAuthSignIn";
import {
  isAuthCompletionPending,
  isAuthNavigationPending,
  publishAuthResult,
  resetAuthFlow,
} from "@/lib/authCompletion";
import { clearOAuthPending, getOAuthPending, resolveFromOnboarding } from "@/lib/oauthPending";
import { clearOnboardingOAuthPending, isOnboardingInProgress, isOnboardingOAuthPending } from "@/lib/onboardingSession";

/**
 * Handles Google/Apple OAuth return on any route (e.g. /auth?code=… or app.frigy.app/).
 * UI/errors: AuthFlowOverlay reads AuthResult — no local error UI here.
 */
export function AuthOAuthCallbackBootstrap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSubscription, user, loading } = useAuth();
  const oauthCallbackHandledRef = useRef(false);

  useEffect(() => {
    if (oauthCallbackHandledRef.current) return;

    const href = window.location.href;

    if (isOAuthErrorUrl(href)) {
      oauthCallbackHandledRef.current = true;
      clearOAuthPending();
      window.history.replaceState({}, "", "/auth?oauth_error=1");
      return;
    }

    if (!isOAuthCallbackUrl(href)) return;

    oauthCallbackHandledRef.current = true;
    publishAuthResult({ status: "pending", phase: "oauth_exchange" });

    void (async () => {
      const fromOnboarding =
        resolveFromOnboarding(href) ||
        isOnboardingInProgress() ||
        isOnboardingOAuthPending();

      const result = await handleOAuthCallbackUrl({
        url: href,
        checkSubscription,
        navigate,
        onExchangeSuccess: () => {
          window.history.replaceState(
            {},
            "",
            fromOnboarding ? "/?onboardingStep=paywall" : "/",
          );
        },
      });

      if (result.status === "error") {
        oauthCallbackHandledRef.current = false;
        return;
      }

      if (result.status === "success" && result.routePhase === "onboarding_paywall") {
        clearOAuthPending();
        clearOnboardingOAuthPending();
        resetAuthFlow();
      }
    })();
  }, [location.pathname, location.search, navigate, checkSubscription]);

  /** Clear stale onboarding OAuth flags — callback handler owns the full pipeline. */
  useEffect(() => {
    if (loading || !user) return;
    if (isOAuthCallbackUrl(window.location.href)) return;
    if (isAuthCompletionPending() || isAuthNavigationPending()) return;

    const pending = getOAuthPending();
    if (pending !== "onboarding") return;

    const onPaywall =
      new URLSearchParams(window.location.search).get("onboardingStep") === "paywall";

    if (onPaywall || isOnboardingInProgress() || isOnboardingOAuthPending()) {
      clearOAuthPending();
      resetAuthFlow();
    }
  }, [loading, user, location.search]);

  return null;
}
