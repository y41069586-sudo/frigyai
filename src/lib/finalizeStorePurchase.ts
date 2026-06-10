import type { SubscriptionStatusLike } from "@/lib/subscription";
import { waitForPremiumAfterPurchase } from "@/lib/subscriptionRefresh";

export type StorePurchaseFinalizeCopy = {
  premiumActivating: string;
  premiumActivatingDesc: string;
  premiumNotActiveYet: string;
  premiumNotActiveDesc: string;
};

type ToastFn = (options: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

/** Poll RevenueCat → Supabase after IAP; surface clear feedback if activation lags. */
export async function finalizeStorePurchase(options: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  accessToken: string;
  copy: StorePurchaseFinalizeCopy;
  toast: ToastFn;
  maxAttempts?: number;
  showActivatingToast?: boolean;
}): Promise<boolean> {
  if (options.showActivatingToast !== false) {
    options.toast({
      title: options.copy.premiumActivating,
      description: options.copy.premiumActivatingDesc,
    });
  }

  const active = await waitForPremiumAfterPurchase(
    options.checkSubscription,
    options.accessToken,
    options.maxAttempts,
  );

  if (!active) {
    options.toast({
      title: options.copy.premiumNotActiveYet,
      description: options.copy.premiumNotActiveDesc,
      variant: "destructive",
    });
  }

  return active;
}
