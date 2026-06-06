import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildPremiumPricingRoute, resolveTrialEligibleFromLocal } from "@/lib/trialEligibility";
import { isSubscriptionActive } from "@/lib/subscription";

const copy = {
  de: {
    title: "Dein Premium ist abgelaufen",
    description:
      "Dein Abo ist nicht mehr aktiv. Schalte Premium frei, um Wochenpläne, Scans und Barcode zu nutzen.",
    cta: "Premium freischalten",
    dismiss: "Später",
  },
  en: {
    title: "Your Premium has expired",
    description:
      "Your subscription is no longer active. Renew Premium to use meal plans, scans, and barcode.",
    cta: "Unlock Premium",
    dismiss: "Not now",
  },
  fr: {
    title: "Ton Premium a expiré",
    description:
      "Ton abonnement n'est plus actif. Réactive Premium pour les plans, scans et codes-barres.",
    cta: "Activer Premium",
    dismiss: "Plus tard",
  },
} as const;

type PremiumGateContextValue = {
  /** Returns true when the user may proceed; otherwise opens the renew dialog. */
  ensurePremium: () => Promise<boolean>;
};

const PremiumGateContext = createContext<PremiumGateContextValue | undefined>(undefined);

export function PremiumGateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isPremium, subscriptionStatus, checkSubscription } = useAuth();
  const [open, setOpen] = useState(false);
  const lang = getStoredLanguage();
  const t = copy[lang] ?? copy.de;

  const ensurePremium = useCallback(async (): Promise<boolean> => {
    if (isPremium) return true;
    if (isSubscriptionActive(subscriptionStatus)) return true;

    // Show paywall immediately — don't wait for slow network checks (multiple taps).
    setOpen(true);

    try {
      const status = await checkSubscription();
      if (isSubscriptionActive(status)) {
        setOpen(false);
        return true;
      }
    } catch {
      /* keep dialog open */
    }

    return false;
  }, [isPremium, subscriptionStatus, checkSubscription]);

  const goToPaywall = useCallback(() => {
    setOpen(false);
    navigate(buildPremiumPricingRoute({ trialEligible: resolveTrialEligibleFromLocal() }), {
      replace: false,
    });
  }, [navigate]);

  const value = useMemo(() => ({ ensurePremium }), [ensurePremium]);

  return (
    <PremiumGateContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent stackLevel="high" className="max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Crown className="h-7 w-7 text-primary" strokeWidth={2} />
            </div>
            <DialogTitle className="text-lg">{t.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {t.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full rounded-xl" onClick={goToPaywall}>
              {t.cta}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-xl text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {t.dismiss}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PremiumGateContext.Provider>
  );
}

export function usePremiumGate(): PremiumGateContextValue {
  const ctx = useContext(PremiumGateContext);
  if (!ctx) {
    throw new Error("usePremiumGate must be used within PremiumGateProvider");
  }
  return ctx;
}
