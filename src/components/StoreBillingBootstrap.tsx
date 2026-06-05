import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usesStoreBilling } from "@/lib/billingPlatform";
import {
  configureStoreBilling,
  isStoreBillingConfigured,
  syncStoreSubscriptionToServer,
} from "@/lib/storeBilling";

const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";

/** Initializes RevenueCat when user is signed in on native apps. */
export function StoreBillingBootstrap() {
  const { user, session, checkSubscription } = useAuth();

  useEffect(() => {
    if (!usesStoreBilling() || !user?.id || !session?.access_token) return;
    if (!isStoreBillingConfigured()) return;

    let cancelled = false;
    let listenerId: string | undefined;

    void (async () => {
      await configureStoreBilling(user.id);
      if (cancelled) return;

      await syncStoreSubscriptionToServer(session.access_token);
      await checkSubscription();

      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      listenerId = await Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
        if (!customerInfo.entitlements.active[ENTITLEMENT_ID]) return;
        await syncStoreSubscriptionToServer(session.access_token);
        await checkSubscription();
      });
    })();

    return () => {
      cancelled = true;
      if (listenerId) {
        void import("@revenuecat/purchases-capacitor").then(({ Purchases }) =>
          Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerId! }),
        );
      }
    };
  }, [user?.id, session?.access_token, checkSubscription]);

  return null;
}
