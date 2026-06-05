import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Bell, Crown, Loader2 } from "lucide-react";
import { Language, useLanguage } from "@/contexts/LanguageContext";
import { getAppLocale } from "@/lib/mealPlanLanguage";
import { ONBOARDING_PALETTE } from "@/components/onboarding/palette";
import { usesStoreBilling } from "@/lib/billingPlatform";
import type { StoreOfferingPrices } from "@/lib/storeBilling";
import {
  getMarketingMonthlyPrice,
  getMarketingYearlyPrice,
  resolveMonthlyDisplayPrice,
  resolveYearlyDisplayPrice,
} from "@/lib/subscriptionPricing";

export type PaywallBillingPlan = "monthly" | "yearly";

type OnboardingPaywallStepProps = {
  language: Language;
  onBack?: () => void;
  onCheckout: (plan: PaywallBillingPlan) => void | Promise<void>;
  onRestorePurchases?: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
  isCheckoutLoading?: boolean;
  isRestoreLoading?: boolean;
  storePrices?: StoreOfferingPrices | null;
  /** False after trial or any prior subscription — hides trial timeline & intro offer UI. */
  trialEligible?: boolean;
};

const copy = {
  de: {
    unlockTitle: "Schalte Frigy frei, um deine Ziele schneller zu erreichen",
    trialTitle: "Starte deine 3-tägige KOSTENLOSE Testphase",
    monthly: "Monatlich",
    yearly: "Jährlich",
    monthlyPrice: "€9,99",
    monthlySuffix: "/Mo",
    yearlyPrice: "€36,95/Jahr",
    trialBadge: "3 TAGE KOSTENLOS",
    feature1Title: "Einfaches Food-Scanning",
    feature1Desc: "Tracke deine Kalorien mit nur einem Bild",
    feature2Title: "Erreiche deine Ziele Schritt für Schritt",
    feature2Desc: "Klare Mahlzeiten und Makros – ohne medizinische Versprechen",
    feature3Title: "Verfolge deinen Fortschritt",
    feature3Desc: "Bleib auf Kurs mit personalisierten Einblicken",
    trialToday: "Heute",
    trialTodayDesc: "Alle Premium-Funktionen freischalten – KI-Scan, Tracker und mehr",
    trialReminder: "In 2 Tagen – Erinnerung",
    trialReminderDesc: "Wir erinnern dich, dass deine Testphase bald endet",
    trialBilling: "In 3 Tagen – Abrechnung",
    trialBillingPrefix: "Abrechnung am",
    trialBillingSuffix: ", sofern du nicht vorher kündigst",
    noCommitment: "Keine Bindung – jederzeit kündbar",
    noPaymentNow: "Keine Zahlung jetzt fällig",
    ctaUnlock: "Loslegen",
    ctaTrial: "3-tägige Testphase starten",
    footerMonthly: "Nur €9,99 pro Monat",
    footerTrial: "3 Tage kostenlos, danach €9,99/Monat",
    footerYearly: "Jährlich – €36,95 pro Jahr",
    subscriptionName: "Frigy Premium",
    planLengthMonthly: "Monatsabo (1 Monat)",
    planLengthYearly: "Jahresabo (1 Jahr)",
    autoRenewStore:
      "Das Abo verlängert sich automatisch, bis du es mindestens 24 Stunden vor Periodenende in den Einstellungen deines App-Store- oder Google-Play-Kontos kündigst. Die Zahlung wird bei Bestätigung über dein Store-Konto abgebucht.",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutz",
  },
  en: {
    unlockTitle: "Unlock Frigy to reach your goals faster",
    trialTitle: "Start your 3-day FREE trial",
    monthly: "Monthly",
    yearly: "Yearly",
    monthlyPrice: "€9.99",
    monthlySuffix: "/mo",
    yearlyPrice: "€36.95/yr",
    trialBadge: "3 DAYS FREE",
    feature1Title: "Easy food scanning",
    feature1Desc: "Track your calories with just a picture",
    feature2Title: "Reach your goals step by step",
    feature2Desc: "Clear meals and macros — no medical promises",
    feature3Title: "Track your progress",
    feature3Desc: "Stay on track with personalized insights",
    trialToday: "Today",
    trialTodayDesc: "Unlock all premium features – AI scan, tracker and more",
    trialReminder: "In 2 Days – Reminder",
    trialReminderDesc: "We'll remind you that your trial is ending soon",
    trialBilling: "In 3 Days – Billing Starts",
    trialBillingPrefix: "You'll be charged on",
    trialBillingSuffix: " unless you cancel anytime before",
    noCommitment: "No commitment – cancel anytime",
    noPaymentNow: "No payment due now",
    ctaUnlock: "Start my journey",
    ctaTrial: "Start my 3-day free trial",
    footerMonthly: "Just €9.99 per month",
    footerTrial: "3 days free, then €9.99/mo",
    footerYearly: "Yearly – €36.95 per year",
    subscriptionName: "Frigy Premium",
    planLengthMonthly: "Monthly subscription (1 month)",
    planLengthYearly: "Yearly subscription (1 year)",
    autoRenewStore:
      "Subscription automatically renews unless cancelled at least 24 hours before the end of the current period in your App Store or Google Play account settings. Payment is charged to your store account at confirmation.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  },
  fr: {
    unlockTitle: "Débloque Frigy pour atteindre tes objectifs plus vite",
    trialTitle: "Commence ton essai GRATUIT de 3 jours",
    monthly: "Mensuel",
    yearly: "Annuel",
    monthlyPrice: "9,99 €",
    monthlySuffix: "/mois",
    yearlyPrice: "36,95 €/an",
    trialBadge: "3 JOURS GRATUITS",
    feature1Title: "Scan alimentaire facile",
    feature1Desc: "Suis tes calories avec une simple photo",
    feature2Title: "Atteins tes objectifs pas à pas",
    feature2Desc: "Repas et macros clairs — sans promesses médicales",
    feature3Title: "Suis tes progrès",
    feature3Desc: "Reste sur la bonne voie avec des insights personnalisés",
    trialToday: "Aujourd'hui",
    trialTodayDesc: "Débloque toutes les fonctions premium – scan IA, suivi et plus",
    trialReminder: "Dans 2 jours – Rappel",
    trialReminderDesc: "On te rappellera que ton essai se termine bientôt",
    trialBilling: "Dans 3 jours – Facturation",
    trialBillingPrefix: "Facturation le",
    trialBillingSuffix: ", sauf annulation avant",
    noCommitment: "Sans engagement – annule à tout moment",
    noPaymentNow: "Aucun paiement maintenant",
    ctaUnlock: "Commencer",
    ctaTrial: "Démarrer l'essai de 3 jours",
    footerMonthly: "Seulement 9,99 €/mois",
    footerTrial: "3 jours gratuits, puis 9,99 €/mois",
    footerYearly: "Annuel – 36,95 € par an",
    subscriptionName: "Frigy Premium",
    planLengthMonthly: "Abonnement mensuel (1 mois)",
    planLengthYearly: "Abonnement annuel (1 an)",
    autoRenewStore:
      "L'abonnement se renouvelle automatiquement sauf annulation au moins 24 h avant la fin de la période dans les réglages App Store ou Google Play. Le paiement est débité sur ton compte store à la confirmation.",
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
  },
};

function formatBillingDate(language: Language): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString(getAppLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PlanRadio({ selected }: { selected: boolean }) {
  return (
    <motion.div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
      animate={{
        borderColor: selected ? ONBOARDING_PALETTE.primaryDark : ONBOARDING_PALETTE.cardBorderIdle,
        backgroundColor: selected ? ONBOARDING_PALETTE.primaryDark : "transparent",
      }}
    >
      {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
    </motion.div>
  );
}

export function OnboardingPaywallStep({
  language,
  onCheckout,
  onRestorePurchases,
  onSignOut,
  isCheckoutLoading = false,
  isRestoreLoading = false,
  storePrices = null,
  trialEligible = true,
}: OnboardingPaywallStepProps) {
  const { t: globalT } = useLanguage();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PaywallBillingPlan>("monthly");
  const t = copy[language];
  const billingDate = useMemo(() => formatBillingDate(language), [language]);
  const isMonthly = plan === "monthly";
  const showStoreRestore = usesStoreBilling() && Boolean(onRestorePurchases);
  const isStoreBilling = usesStoreBilling();

  const monthlyPrice = resolveMonthlyDisplayPrice(language, storePrices?.monthly?.priceString);
  const yearlyPrice = resolveYearlyDisplayPrice(language, storePrices?.yearly?.priceString);
  const storeMonthlyHasIntro = storePrices?.monthly?.hasIntroOffer ?? true;
  const showMonthlyTrialUi = trialEligible && storeMonthlyHasIntro;

  const autoRenewText = t.autoRenewStore;
  const selectedPlanLabel = isMonthly ? t.planLengthMonthly : t.planLengthYearly;
  const selectedPrice = isMonthly ? monthlyPrice : yearlyPrice;

  const footerText = useMemo(() => {
    if (isMonthly) {
      if (storePrices?.monthly) {
        return showMonthlyTrialUi
          ? `${t.noPaymentNow} · ${monthlyPrice}`
          : `${monthlyPrice} ${t.monthlySuffix.trim()}`;
      }
      return showMonthlyTrialUi ? t.footerTrial : t.footerMonthly;
    }
    if (storePrices?.yearly) {
      return `${t.yearly} · ${yearlyPrice}`;
    }
    return t.footerYearly;
  }, [isMonthly, storePrices, showMonthlyTrialUi, monthlyPrice, yearlyPrice, t]);

  const features = [
    { title: t.feature1Title, desc: t.feature1Desc },
    { title: t.feature2Title, desc: t.feature2Desc },
    { title: t.feature3Title, desc: t.feature3Desc },
  ];

  const trialSteps = [
    {
      icon: Lock,
      title: t.trialToday,
      desc: t.trialTodayDesc,
    },
    {
      icon: Bell,
      title: t.trialReminder,
      desc: t.trialReminderDesc,
    },
    {
      icon: Crown,
      title: t.trialBilling,
      desc: `${t.trialBillingPrefix} ${billingDate}${t.trialBillingSuffix}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-0 flex-1 flex-col bg-white text-[#0a0a0a]"
    >
      <motion.div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={showMonthlyTrialUi ? "trial" : "unlock"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-md pb-28 pt-1"
          >
            <h1 className="mb-5 text-center text-lg font-bold leading-snug tracking-tight min-[390px]:text-xl">
              {showMonthlyTrialUi ? t.trialTitle : t.unlockTitle}
            </h1>

            {showMonthlyTrialUi ? (
              <div className="space-y-1">
                {trialSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === trialSteps.length - 1;
                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex gap-3.5"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
                          }}
                        >
                          <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
                        </div>
                        {!isLast && (
                          <div
                            className="my-1 w-0.5 min-h-[2.25rem] flex-1"
                            style={{
                              background: `linear-gradient(180deg, ${ONBOARDING_PALETTE.primaryDark}, ${ONBOARDING_PALETTE.cardBorderIdle})`,
                            }}
                          />
                        )}
                      </div>
                      <div className={`min-w-0 flex-1 ${isLast ? "pb-1" : "pb-6"}`}>
                        <p className="text-[15px] font-bold leading-snug">{step.title}</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <ul className="space-y-4">
                {features.map((f, i) => (
                  <motion.li
                    key={f.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i }}
                    className="flex gap-3 text-left"
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: ONBOARDING_PALETTE.primary }}
                    >
                      <Check className="h-4 w-4 text-[#0a0a0a]" strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-snug">{f.title}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">{f.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="h-4" aria-hidden />
      </motion.div>

      <div className="relative z-20 shrink-0 border-t border-[#E5E7EB] bg-white px-4 pt-4 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.1)] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <div
          className="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white"
          aria-hidden
        />
        <div className="mx-auto w-full max-w-md">
          <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`relative min-h-[88px] rounded-2xl border-2 bg-white px-3 pb-3 text-left transition-all touch-manipulation ${showMonthlyTrialUi ? "pt-5" : "pt-4"}`}
            style={{
              borderColor: plan === "monthly" ? ONBOARDING_PALETTE.primaryDark : ONBOARDING_PALETTE.cardBorderIdle,
              boxShadow: plan === "monthly" ? ONBOARDING_PALETTE.shadowCard : "none",
            }}
          >
            {showMonthlyTrialUi && (
              <span
                className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: ONBOARDING_PALETTE.primaryDeep }}
              >
                {t.trialBadge}
              </span>
            )}
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 pr-0.5">
                <p className="text-[13px] font-semibold text-[#374151]">{t.monthly}</p>
                <p className="mt-1.5 text-[17px] font-bold leading-none tracking-tight">
                  {getMarketingMonthlyPrice(language)}
                  <span className="text-[12px] font-medium text-[#6B7280]">{t.monthlySuffix}</span>
                </p>
              </div>
              <PlanRadio selected={plan === "monthly"} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className="relative min-h-[88px] rounded-2xl border-2 bg-white px-3 pb-3 pt-4 text-left transition-all touch-manipulation"
            style={{
              borderColor: plan === "yearly" ? ONBOARDING_PALETTE.primaryDark : ONBOARDING_PALETTE.cardBorderIdle,
              boxShadow: plan === "yearly" ? ONBOARDING_PALETTE.shadowCard : "none",
            }}
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 pr-0.5">
                <p className="text-[13px] font-semibold text-[#374151]">{t.yearly}</p>
                <p className="mt-1.5 text-[17px] font-bold leading-none tracking-tight">{yearlyPrice}</p>
              </div>
              <PlanRadio selected={plan === "yearly"} />
            </div>
          </button>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[15px] text-[#374151]">
            <Check className="h-5 w-5 shrink-0" style={{ color: ONBOARDING_PALETTE.primaryDeep }} strokeWidth={2.5} />
            {showMonthlyTrialUi ? t.noPaymentNow : t.noCommitment}
          </p>

          <motion.button
            type="button"
            whileTap={{ scale: isCheckoutLoading ? 1 : 0.98 }}
            disabled={isCheckoutLoading || isRestoreLoading}
            onClick={() => void onCheckout(plan)}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl py-4 text-[17px] font-bold text-[#0a0a0a] touch-manipulation disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
              boxShadow: ONBOARDING_PALETTE.shadowButton,
            }}
          >
            {isCheckoutLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {globalT.loading}
              </>
            ) : (
              (showMonthlyTrialUi ? t.ctaTrial : t.ctaUnlock)
            )}
          </motion.button>

          {showStoreRestore && (
            <button
              type="button"
              disabled={isCheckoutLoading || isRestoreLoading}
              onClick={() => void onRestorePurchases?.()}
              className="mt-3 w-full py-2.5 text-center text-[14px] font-semibold text-[#374151] underline underline-offset-2 transition-colors hover:text-[#0a0a0a] disabled:opacity-60"
            >
              {isRestoreLoading ? globalT.loading : globalT.restorePurchases}
            </button>
          )}

          {onSignOut && (
            <button
              type="button"
              disabled={isCheckoutLoading || isRestoreLoading}
              onClick={() => void onSignOut()}
              className="mt-2 w-full py-2 text-center text-[12px] font-medium text-[#9CA3AF] transition-colors hover:text-[#6B7280] disabled:opacity-60"
            >
              {globalT.paywallSignOut}
            </button>
          )}

          <p className="mt-4 text-center text-[12px] font-medium leading-snug text-[#6B7280]">
            {t.subscriptionName} · {selectedPlanLabel} · {selectedPrice}
            {showMonthlyTrialUi ? ` · ${t.trialBadge}` : ""}
          </p>

          <p className="mt-2 text-center text-[11px] leading-relaxed text-[#9CA3AF]">
            {autoRenewText}
          </p>

          <nav
            className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium"
            aria-label={t.terms}
          >
            <button
              type="button"
              onClick={() => navigate("/legal/agb")}
              className="text-[#6B7280] underline underline-offset-2 hover:text-[#374151]"
            >
              {t.terms}
            </button>
            <span className="text-[#D1D5DB]" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={() => navigate("/legal/datenschutz")}
              className="text-[#6B7280] underline underline-offset-2 hover:text-[#374151]"
            >
              {t.privacy}
            </button>
          </nav>

          <p className="mt-3 text-center text-[13px] leading-snug text-[#9CA3AF]">
            {footerText}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
