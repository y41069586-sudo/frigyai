import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, X, Lock, Bell, Crown } from "lucide-react";
import { Language } from "@/contexts/LanguageContext";
import { ONBOARDING_PALETTE } from "@/components/onboarding/palette";

export type PaywallBillingPlan = "monthly" | "yearly";

export const STRIPE_PAYMENT_LINKS: Record<PaywallBillingPlan, string> = {
  monthly: "https://buy.stripe.com/aFa6oH2Lu4JhdcudLx87K03",
  yearly: "https://buy.stripe.com/8x29AT99S3Fd3BUePB87K02",
};

type OnboardingPaywallStepProps = {
  language: Language;
  onBack: () => void;
  onSkip: () => void;
  onCheckout: (plan: PaywallBillingPlan) => void;
};

const copy = {
  de: {
    unlockTitle: "Schalte Frigy frei, um deine Ziele schneller zu erreichen",
    trialTitle: "Starte deine 3-tägige KOSTENLOSE Testphase",
    monthly: "Monatlich",
    yearly: "Jährlich",
    monthlyPrice: "€10,99",
    monthlySuffix: "/Mo",
    yearlyPrice: "€0,71/Woche",
    trialBadge: "3 TAGE KOSTENLOS",
    feature1Title: "Einfaches Food-Scanning",
    feature1Desc: "Tracke deine Kalorien mit nur einem Bild",
    feature2Title: "Erreiche deinen Traumkörper",
    feature2Desc: "Wir halten es einfach – damit du schneller Ergebnisse siehst",
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
    footerMonthly: "Nur €10,99 pro Monat",
    footerTrial: "3 Tage kostenlos, danach €10,99/Monat",
    footerYearly: "Jährlich – nur 0,71 Cent die Woche",
  },
  en: {
    unlockTitle: "Unlock Frigy to reach your goals faster",
    trialTitle: "Start your 3-day FREE trial",
    monthly: "Monthly",
    yearly: "Yearly",
    monthlyPrice: "€10.99",
    monthlySuffix: "/mo",
    yearlyPrice: "€0.71/week",
    trialBadge: "3 DAYS FREE",
    feature1Title: "Easy food scanning",
    feature1Desc: "Track your calories with just a picture",
    feature2Title: "Get your dream body",
    feature2Desc: "We keep it simple to make getting results easy",
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
    footerMonthly: "Just €10.99 per month",
    footerTrial: "3 days free, then €10.99/mo",
    footerYearly: "Yearly – only €0.71 per week",
  },
  fr: {
    unlockTitle: "Débloque Frigy pour atteindre tes objectifs plus vite",
    trialTitle: "Commence ton essai GRATUIT de 3 jours",
    monthly: "Mensuel",
    yearly: "Annuel",
    monthlyPrice: "10,99 €",
    monthlySuffix: "/mois",
    yearlyPrice: "0,71 €/semaine",
    trialBadge: "3 JOURS GRATUITS",
    feature1Title: "Scan alimentaire facile",
    feature1Desc: "Suis tes calories avec une simple photo",
    feature2Title: "Atteins ton corps de rêve",
    feature2Desc: "On garde les choses simples pour des résultats rapides",
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
    footerMonthly: "Seulement 10,99 €/mois",
    footerTrial: "3 jours gratuits, puis 10,99 €/mois",
    footerYearly: "Annuel – seulement 0,71 cent la semaine",
  },
};

function formatBillingDate(language: Language): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString(
    language === "de" ? "de-DE" : language === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  );
}

function PlanRadio({ selected }: { selected: boolean }) {
  return (
    <motion.div
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
      animate={{
        borderColor: selected ? ONBOARDING_PALETTE.primaryDark : ONBOARDING_PALETTE.cardBorderIdle,
        backgroundColor: selected ? ONBOARDING_PALETTE.primaryDark : "transparent",
      }}
    >
      {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </motion.div>
  );
}

export function OnboardingPaywallStep({
  language,
  onBack,
  onSkip,
  onCheckout,
}: OnboardingPaywallStepProps) {
  const [plan, setPlan] = useState<PaywallBillingPlan>("monthly");
  const t = copy[language];
  const billingDate = useMemo(() => formatBillingDate(language), [language]);
  const isMonthly = plan === "monthly";

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
      active: true,
    },
    {
      icon: Bell,
      title: t.trialReminder,
      desc: t.trialReminderDesc,
      active: true,
    },
    {
      icon: Crown,
      title: t.trialBilling,
      desc: `${t.trialBillingPrefix} ${billingDate}${t.trialBillingSuffix}`,
      active: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-0 flex-1 flex-col bg-white text-[#0a0a0a]"
    >
      {/* Top nav */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-30 flex shrink-0 items-center justify-between px-4 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Zurück"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-black/5"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Schließen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-black/5"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </motion.div>

      <motion.div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={isMonthly ? "trial" : "unlock"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-[300px] pb-5 pt-1"
          >
            <h1 className="mb-6 text-center text-[1.125rem] font-bold leading-[1.28] tracking-tight min-[390px]:text-[1.2rem]">
              {isMonthly ? t.trialTitle : t.unlockTitle}
            </h1>

            {isMonthly ? (
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
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: step.active
                              ? `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`
                              : "#111827",
                          }}
                        >
                          <Icon className="h-[15px] w-[15px] text-white" strokeWidth={2.2} />
                        </div>
                        {!isLast && (
                          <div
                            className="my-0.5 w-0.5 min-h-[2rem] flex-1"
                            style={{
                              background: step.active
                                ? `linear-gradient(180deg, ${ONBOARDING_PALETTE.primaryDark}, ${ONBOARDING_PALETTE.cardBorderIdle})`
                                : ONBOARDING_PALETTE.cardBorderIdle,
                            }}
                          />
                        )}
                      </div>
                      <div className={`min-w-0 flex-1 ${isLast ? "pb-1" : "pb-5"}`}>
                        <p className="text-[13px] font-bold leading-snug">{step.title}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">{step.desc}</p>
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
                    className="flex gap-2.5 text-left"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: ONBOARDING_PALETTE.primary }}
                    >
                      <Check className="h-3.5 w-3.5 text-[#0a0a0a]" strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold leading-snug">{f.title}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">{f.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="h-8" aria-hidden />
      </motion.div>

      <div className="relative z-20 shrink-0 border-t border-[#E5E7EB] bg-white px-6 pt-4 shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.12)] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-white"
          aria-hidden
        />
        <div className="mx-auto w-full max-w-[300px]">
          <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className="relative min-h-[72px] rounded-[14px] border-2 bg-white px-2.5 pb-2.5 pt-4 text-left transition-all touch-manipulation"
            style={{
              borderColor: plan === "monthly" ? ONBOARDING_PALETTE.primaryDark : ONBOARDING_PALETTE.cardBorderIdle,
              boxShadow: plan === "monthly" ? ONBOARDING_PALETTE.shadowCard : "none",
            }}
          >
            <span
              className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: ONBOARDING_PALETTE.primaryDeep }}
            >
              {t.trialBadge}
            </span>
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 pr-0.5">
                <p className="text-[11px] font-semibold text-[#374151]">{t.monthly}</p>
                <p className="mt-1 text-[14px] font-bold leading-none tracking-tight">
                  {t.monthlyPrice}
                  <span className="text-[10px] font-medium text-[#6B7280]">{t.monthlySuffix}</span>
                </p>
              </div>
              <PlanRadio selected={plan === "monthly"} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className="relative min-h-[72px] rounded-[14px] border-2 bg-white px-2.5 pb-2.5 pt-3 text-left transition-all touch-manipulation"
            style={{
              borderColor: plan === "yearly" ? ONBOARDING_PALETTE.primaryDark : ONBOARDING_PALETTE.cardBorderIdle,
              boxShadow: plan === "yearly" ? ONBOARDING_PALETTE.shadowCard : "none",
            }}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 pr-0.5">
                <p className="text-[11px] font-semibold text-[#374151]">{t.yearly}</p>
                <p className="mt-1 text-[14px] font-bold leading-none tracking-tight">{t.yearlyPrice}</p>
              </div>
              <PlanRadio selected={plan === "yearly"} />
            </div>
          </button>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[13px] text-[#374151]">
            <Check className="h-4 w-4 shrink-0" style={{ color: ONBOARDING_PALETTE.primaryDeep }} strokeWidth={2.5} />
            {isMonthly ? t.noPaymentNow : t.noCommitment}
          </p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onCheckout(plan)}
            className="mt-3 w-full rounded-2xl py-3.5 text-[16px] font-bold text-[#0a0a0a] touch-manipulation"
            style={{
              background: `linear-gradient(135deg, ${ONBOARDING_PALETTE.primary}, ${ONBOARDING_PALETTE.primaryDark})`,
              boxShadow: ONBOARDING_PALETTE.shadowButton,
            }}
          >
            {isMonthly ? t.ctaTrial : t.ctaUnlock}
          </motion.button>

          <p className="mt-2.5 text-center text-[11px] leading-snug text-[#9CA3AF]">
            {isMonthly ? t.footerTrial : plan === "yearly" ? t.footerYearly : t.footerMonthly}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
