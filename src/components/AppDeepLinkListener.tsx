import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { resolveDeepLink } from "@/lib/appDeepLink";
import { captureReferralAttribution, applyDeferredReferralOnFirstOpen } from "@/lib/referralAttribution";
import { markStripeCheckoutPending } from "@/lib/stripePaymentLinks";
import { ChottuLinkNative } from "@/lib/chottuLinkNative";

function shouldForwardToChottuSdk(url: string): boolean {
  if (!url?.trim()) return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const hasReferral = ["ref", "referral", "code", "invite"].some((key) => parsed.searchParams.has(key));

    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && host.endsWith(".chottu.link")) {
      return true;
    }

    if (parsed.protocol === "frigy:") {
      return host === "signup" || host === "invite" || host === "referral" || hasReferral;
    }

    return hasReferral;
  } catch {
    const normalized = url.toLowerCase();
    return normalized.includes("chottu.link") || normalized.includes("ref=");
  }
}

/**
 * Handles frigy://, Universal Links, App Links (ChottuLink) on iOS/Android.
 */
export function AppDeepLinkListener() {
  const navigate = useNavigate();
  const recentlyHandledUrlsRef = useRef<Map<string, number>>(new Map());

  const handleUrl = useCallback((url: string) => {
    if (!url?.trim()) return;

    const now = Date.now();
    const recent = recentlyHandledUrlsRef.current;
    const lastHandledAt = recent.get(url) ?? 0;
    if (now - lastHandledAt < 1500) return;

    recent.set(url, now);
    if (recent.size > 20) {
      for (const [entryUrl, timestamp] of recent.entries()) {
        if (now - timestamp > 10_000) {
          recent.delete(entryUrl);
        }
      }
    }

    const { path, referralRef } = resolveDeepLink(url);
    if (referralRef) {
      captureReferralAttribution(referralRef);
    }
    if (!path) return;

    if (path.includes("subscription=success")) {
      markStripeCheckoutPending();
    }

    navigate(path, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    applyDeferredReferralOnFirstOpen();

    const sdkApiKey = (import.meta.env.VITE_CHOTTULINK_API_KEY as string | undefined)?.trim();
    const listenerRemovers: Array<() => void> = [];

    const pipeUrl = (url: string, options?: { fromSdk?: boolean }) => {
      handleUrl(url);
      if (!sdkApiKey || options?.fromSdk || !shouldForwardToChottuSdk(url)) return;

      void ChottuLinkNative.handleLink({ url }).catch((error) => {
        console.warn("[ChottuLink] handleLink failed:", error);
      });
    };

    if (sdkApiKey) {
      void ChottuLinkNative.addListener("deepLinkResolved", (event) => {
        pipeUrl(event.url, { fromSdk: true });
      }).then((handle) => {
        listenerRemovers.push(() => {
          void handle.remove();
        });
      });

      void ChottuLinkNative.addListener("deepLinkFailed", (event) => {
        console.warn("[ChottuLink] deep link failed:", event);
      }).then((handle) => {
        listenerRemovers.push(() => {
          void handle.remove();
        });
      });

      void ChottuLinkNative.initialize({
        apiKey: sdkApiKey,
        debug: import.meta.env.DEV,
      }).catch((error) => {
        console.warn("[ChottuLink] initialization failed:", error);
      });
    } else {
      console.warn("[ChottuLink] VITE_CHOTTULINK_API_KEY missing - deferred install tracking disabled.");
    }

    void App.addListener("appUrlOpen", (event) => {
      pipeUrl(event.url);
    }).then((handle) => {
      listenerRemovers.push(() => {
        void handle.remove();
      });
    });

    void App.getLaunchUrl().then((result) => {
      if (result?.url) {
        pipeUrl(result.url);
      }
    });

    return () => {
      listenerRemovers.forEach((remove) => remove());
    };
  }, [handleUrl]);

  return null;
}
