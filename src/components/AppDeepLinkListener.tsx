import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { resolveDeepLink } from "@/lib/appDeepLink";
import { captureReferralAttribution, applyDeferredReferralOnFirstOpen } from "@/lib/referralAttribution";
import { markStripeCheckoutPending } from "@/lib/stripePaymentLinks";

/**
 * Handles frigy://, Universal Links, App Links (ChottuLink) on iOS/Android.
 */
export function AppDeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    applyDeferredReferralOnFirstOpen();

    const handleUrl = (url: string) => {
      const { path, referralRef } = resolveDeepLink(url);
      if (referralRef) {
        captureReferralAttribution(referralRef);
      }
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
