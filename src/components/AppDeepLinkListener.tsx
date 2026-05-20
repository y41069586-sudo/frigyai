import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { resolveDeepLinkPath } from "@/lib/appDeepLink";
import { markStripeCheckoutPending } from "@/lib/stripePaymentLinks";

/**
 * Handles frigy://… and cold-start deep links on iOS/Android (Capacitor).
 */
export function AppDeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (url: string) => {
      const path = resolveDeepLinkPath(url);
      if (!path) return;

      if (path.includes("subscription=success")) {
        markStripeCheckoutPending();
      }

      navigate(path, { replace: true });
    };

    let removeListener: (() => void) | undefined;

    void App.addListener("appUrlOpen", (event) => {
      handleUrl(event.url);
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    void App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleUrl(result.url);
      }
    });

    return () => {
      removeListener?.();
    };
  }, [navigate]);

  return null;
}
