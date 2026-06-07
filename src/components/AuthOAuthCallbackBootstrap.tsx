import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isOAuthCallbackUrl, isOAuthErrorUrl } from "@/lib/authOAuth";
import { handleOAuthCallbackUrl } from "@/lib/completeOAuthSignIn";
import { clearOAuthPending, getOAuthPending } from "@/lib/oauthPending";
import { publishAuthResult } from "@/lib/authCompletion";
import { redirectAfterSignIn } from "@/lib/postAuthRedirect";

/**
 * Handles Google/Apple OAuth return on any route (e.g. /auth?code=… or app.frigy.app/).
 * UI/errors: AuthFlowOverlay reads AuthResult — no local error UI here.
 */
export function AuthOAuthCallbackBootstrap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSubscription, user, loading } = useAuth();
  const oauthCallbackHandledRef = useRef(false);
  const pendingRedirectStartedRef = useRef(false);

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
      const result = await handleOAuthCallbackUrl({
        url: href,
        checkSubscription,
        navigate,
        onExchangeSuccess: () => {
          window.history.replaceState({}, "", "/");
        },
      });

      if (result.status === "error") {
        oauthCallbackHandledRef.current = false;
      }
    })();
  }, [location.pathname, location.search, navigate, checkSubscription]);

  useEffect(() => {
    if (loading || pendingRedirectStartedRef.current || !user) return;

    const pending = getOAuthPending();
    // Login OAuth is completed by the deep-link / ?code= pipeline — not this fallback.
    if (pending !== "onboarding") return;

    pendingRedirectStartedRef.current = true;
    clearOAuthPending();

    void redirectAfterSignIn({
      userId: user.id,
      checkSubscription,
      navigate,
      fromOnboarding: true,
      authIntent: "signup",
    });
  }, [loading, user, navigate, checkSubscription]);

  return null;
}
