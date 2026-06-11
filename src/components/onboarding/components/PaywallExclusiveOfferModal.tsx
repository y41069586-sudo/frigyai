import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Loader2, Sparkles, X } from "lucide-react";
import { Language, useLanguage } from "@/contexts/LanguageContext";
import { ONBOARDING_PALETTE } from "@/components/onboarding/palette";
import { buildExclusiveYearlyOffer } from "@/lib/paywallPricing";
import type { StorePlanPrice } from "@/lib/storeBilling";

type PaywallExclusiveOfferModalProps = {
  open: boolean;
  language: Language;
  regularYearlyPrice: StorePlanPrice | null | undefined;
  promoYearlyPrice: StorePlanPrice | null | undefined;
  pricesLoading?: boolean;
  checkoutLoading?: boolean;
  onClose: () => void;
  onClaimPromoYearly: () => void | Promise<void>;
};

const copy: Record<
  Language,
  {
    teaserTitle: string;
    openCta: string;
    openedTitle: string;
    openedSubtitle: string;
    yearlyLabel: string;
    claimCta: string;
    unavailable: string;
    discountBadge: (percent: number) => string;
  }
> = {
  de: {
    teaserTitle: "Öffne dein exklusives Angebot!",
    openCta: "Öffnen",
    openedTitle: "Dein Jahresabo-Rabatt",
    openedSubtitle: "Nur für kurze Zeit – sichere dir Premium zum Sonderpreis.",
    yearlyLabel: "Jahresabo",
    claimCta: "Jetzt holen",
    unavailable: "Angebot wird geladen…",
    discountBadge: (p) => `-${p}%`,
  },
  en: {
    teaserTitle: "Open your exclusive offer!",
    openCta: "Open",
    openedTitle: "Your yearly discount",
    openedSubtitle: "Limited time – get Premium at a special price.",
    yearlyLabel: "Yearly plan",
    claimCta: "Get it now",
    unavailable: "Loading promo yearly plan…",
    discountBadge: (p) => `-${p}%`,
  },
  fr: {
    teaserTitle: "Ouvre ton offre exclusive !",
    openCta: "Ouvrir",
    openedTitle: "Ta réduction annuelle",
    openedSubtitle: "Offre limitée – Premium à prix spécial.",
    yearlyLabel: "Abonnement annuel",
    claimCta: "Profiter maintenant",
    unavailable: "Chargement de l'offre annuelle…",
    discountBadge: (p) => `-${p}%`,
  },
};

export function PaywallExclusiveOfferModal({
  open,
  language,
  regularYearlyPrice,
  promoYearlyPrice,
  pricesLoading = false,
  checkoutLoading = false,
  onClose,
  onClaimPromoYearly,
}: PaywallExclusiveOfferModalProps) {
  const { t: i18n } = useLanguage();
  const [phase, setPhase] = useState<"gift" | "opened">("gift");
  const t = copy[language];

  useEffect(() => {
    if (!open) setPhase("gift");
  }, [open]);

  const offer = useMemo(
    () => buildExclusiveYearlyOffer(regularYearlyPrice, promoYearlyPrice),
    [regularYearlyPrice, promoYearlyPrice],
  );

  const handleClose = () => {
    setPhase("gift");
    onClose();
  };

  const canClaim = Boolean(offer) && !pricesLoading && !checkoutLoading;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            aria-label={i18n.ariaClose}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#B8F5D4] bg-[#F3FFF8] px-6 pb-6 pt-5 shadow-[0_24px_80px_-20px_rgba(57,212,127,0.55)]"
          >
            <motion.div
              className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#75FBB2]/35 blur-3xl"
              animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-[#39D47F]/25 blur-3xl"
              animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.12, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B7280] shadow-sm transition-colors hover:text-[#0a0a0a]"
              aria-label={i18n.ariaClose}
            >
              <X className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              {phase === "gift" ? (
                <motion.div
                  key="gift-phase"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="relative z-[1] flex flex-col items-center pt-4 text-center"
                >
                  <motion.div
                    className="relative mb-6 flex h-28 w-28 items-center justify-center"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-[2rem] bg-[#75FBB2]/30 blur-xl"
                      animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div
                      className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem]"
                      style={{
                        background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
                        boxShadow: "0 20px 48px -16px rgba(57, 212, 127, 0.75)",
                      }}
                    >
                      <Gift className="h-11 w-11 text-[#0a0a0a]" strokeWidth={2.2} />
                    </div>
                  </motion.div>

                  <h2 className="text-xl font-bold leading-snug tracking-tight text-[#0a0a0a]">
                    {t.teaserTitle}
                  </h2>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPhase("opened")}
                    className="mt-7 flex min-h-[50px] w-full items-center justify-center rounded-2xl text-[17px] font-bold text-[#0a0a0a]"
                    style={{
                      background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
                      boxShadow: ONBOARDING_PALETTE.shadowButton,
                    }}
                  >
                    {t.openCta}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="opened-phase"
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="relative z-[1] flex flex-col items-center pt-4 text-center"
                >
                  <motion.div
                    initial={{ rotate: -8, scale: 0.85, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                    className="relative mb-5 flex h-24 w-24 items-center justify-center"
                  >
                    <Sparkles className="absolute -left-2 top-0 h-5 w-5 text-[#39D47F]" />
                    <Sparkles className="absolute -right-1 bottom-2 h-4 w-4 text-[#75FBB2]" />
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-[1.5rem]"
                      style={{
                        background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
                      }}
                    >
                      <Gift className="h-9 w-9 text-[#0a0a0a]" strokeWidth={2.2} />
                    </div>
                  </motion.div>

                  {offer && offer.discountPercent > 0 && (
                    <span className="rounded-full bg-[#39D47F] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                      {t.discountBadge(offer.discountPercent)}
                    </span>
                  )}

                  <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight text-[#0a0a0a]">
                    {t.openedTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{t.openedSubtitle}</p>

                  <div className="mt-6 w-full rounded-2xl border border-[#B8F5D4] bg-white/80 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      {t.yearlyLabel}
                    </p>
                    {pricesLoading ? (
                      <div className="mx-auto mt-3 h-8 w-32 animate-pulse rounded-lg bg-[#E8F5EE]" />
                    ) : !offer ? (
                      <p className="mt-3 text-sm text-[#6B7280]">{t.unavailable}</p>
                    ) : (
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <p className="text-sm font-medium text-[#9CA3AF] line-through">
                          {offer.originalPriceString}
                        </p>
                        <p className="text-[28px] font-black leading-none tracking-tight text-[#0a0a0a]">
                          {offer.discountedPriceString}
                        </p>
                      </div>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: canClaim ? 0.98 : 1 }}
                    disabled={!canClaim}
                    onClick={() => void onClaimPromoYearly()}
                    className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold text-[#0a0a0a] disabled:opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
                      boxShadow: ONBOARDING_PALETTE.shadowButton,
                    }}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      </>
                    ) : (
                      t.claimCta
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
