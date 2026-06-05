import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isOAuthCallbackUrl, isOAuthErrorUrl } from "@/lib/authOAuth";
import { handleOAuthCallbackUrl } from "@/lib/completeOAuthSignIn";
import { clearOAuthPending, getOAuthPending } from "@/lib/oauthPending";
import { redirectAfterSignIn } from "@/lib/postAuthRedirect";

/**
 * Handles Google/Apple OAuth return on any route (e.g. /auth?code=… or app.frigy.app/).
 * UI/errors: AuthFlowOverlay reads AuthResult — no local error UI here.
 */
export function AuthOAuthCallbackBootstrap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSubscription, user, loading } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || loading) return;

    const href = window.location.href;

    if (isOAuthErrorUrl(href)) {
      handledRef.current = true;
      clearOAuthPending();
      window.history.replaceState({}, "", "/auth?oauth_error=1");
      return;
    }

    if (isOAuthCallbackUrl(href)) {
      handledRef.current = true;

      void (async () => {
        const result = await handleOAuthCallbackUrl({
          url: href,
          checkSubscription,
          navigate,
          onExchangeSuccess: () => {
            window.history.replaceState({}, "", window.location.pathname || "/");
          },
        });

        if (result.status === "error") {
          handledRef.current = false;
        }
      })();
      return;
    }

    const pending = getOAuthPending();
    if (!pending || !user) return;

    handledRef.current = true;
    clearOAuthPending();
    const fromOnboarding = pending === "onboarding";

    void redirectAfterSignIn({
      userId: user.id,
      checkSubscription,
      navigate,
      fromOnboarding,
    });
  }, [loading, user, location.pathname, location.search, navigate, checkSubscription]);

  return null;
}
