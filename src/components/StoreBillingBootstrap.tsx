import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { configureStoreBilling, isStoreBillingConfigured } from "@/lib/storeBilling";

/** Initializes RevenueCat when user is signed in on native apps. */
export function StoreBillingBootstrap() {
  const { user, session } = useAuth();

  useEffect(() => {
    if (!usesStoreBilling() || !user?.id || !session?.access_token) return;
    if (!isStoreBillingConfigured()) return;
    void configureStoreBilling(user.id);
  }, [user?.id, session?.access_token]);

  return null;
}
