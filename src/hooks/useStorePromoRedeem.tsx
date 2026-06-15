import { useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StorePromoCodeDialog } from "@/components/StorePromoCodeDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { redeemStorePromoCode } from "@/lib/storeBilling";
import { waitForPremiumAfterPurchase } from "@/lib/subscriptionRefresh";

type UseStorePromoRedeemOptions = {
  accessToken?: string | null;
  userId?: string | null;
  checkSubscription: () => Promise<unknown>;
  onSuccess?: () => void | Promise<void>;
  loginRequiredMessage?: string;
};

export function useStorePromoRedeem({
  accessToken,
  userId,
  checkSubscription,
  onSuccess,
  loginRequiredMessage,
}: UseStorePromoRedeemOptions) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const executeRedeem = useCallback(
    async (code?: string) => {
      if (!accessToken) {
        toast({
          title: t.error,
          description: loginRequiredMessage ?? t.onboardingPleaseLoginToProceed,
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const result = await redeemStorePromoCode(accessToken, userId, { code });
        const active = await waitForPremiumAfterPurchase(checkSubscription, accessToken, 6);

        if (result.ok || active) {
          setDialogOpen(false);
          await onSuccess?.();
          return;
        }

        if (!result.cancelled && result.message) {
          toast({
            title: t.error,
            description: result.message,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [
      accessToken,
      checkSubscription,
      loginRequiredMessage,
      onSuccess,
      t.error,
      t.onboardingPleaseLoginToProceed,
      toast,
      userId,
    ],
  );

  const startRedeem = useCallback(() => {
    if (Capacitor.getPlatform() === "android") {
      setDialogOpen(true);
      return;
    }
    void executeRedeem();
  }, [executeRedeem]);

  const promoCodeDialog = (
    <StorePromoCodeDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      loading={loading}
      onSubmit={(code) => executeRedeem(code)}
    />
  );

  return {
    startRedeem,
    loading,
    promoCodeDialog,
  };
}
