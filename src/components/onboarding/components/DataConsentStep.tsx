import { motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MINT_STEP_HEADER_PT } from "../layout";

type DataConsentStepProps = {
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#F2FFF8",
  text: "#050505",
  muted: "#3F3F46",
};

export function DataConsentStep({ onBack, onNext }: DataConsentStepProps) {
  const { language } = useLanguage();

  const L = {
    de: {
      title: "INTELLIGENTERE VERFOLGUNG, BESSERE ERGEBNISSE",
      intro: "Um deinen persönlichen Abnehmplan zu optimieren, können wir anonymisierte Daten verwenden, um:",
      item1: "Deine häufig verzehrten Lebensmittel und Ernährungsgewohnheiten zu analysieren",
      item2: "Die Genauigkeit der Lebensmittelerkennung für besseres Tracking zu verbessern",
      notNow: "Nicht jetzt",
      enable: "Aktivieren",
      back: "Zurück",
    },
    en: {
      title: "SMARTER TRACKING, BETTER RESULTS",
      intro: "To optimize your personal plan, we can use anonymized data to:",
      item1: "Analyze your frequently eaten foods and nutrition habits",
      item2: "Improve food recognition accuracy for better tracking",
      notNow: "Not now",
      enable: "Enable",
      back: "Back",
    },
    fr: {
      title: "SUIVI PLUS INTELLIGENT, MEILLEURS RÉSULTATS",
      intro: "Pour optimiser ton plan personnel, nous pouvons utiliser des données anonymisées pour :",
      item1: "Analyser tes aliments fréquents et tes habitudes nutritionnelles",
      item2: "Améliorer la reconnaissance alimentaire pour un meilleur suivi",
      notNow: "Pas maintenant",
      enable: "Activer",
      back: "Retour",
    },
  } as const;

  const t = L[language as keyof typeof L] ?? L.de;

  const choose = (enabled: boolean) => {
    localStorage.setItem("frigy_anonymous_data_consent", enabled ? "1" : "0");
    onNext?.();
  };

  const steps = [t.intro, t.item1, t.item2];

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: PALETTE.bg }}>
      <div className="flex shrink-0 items-center px-6 pb-1" style={{ paddingTop: MINT_STEP_HEADER_PT }}>
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label={t.back}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#DCFEEF", color: PALETTE.text }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.6} />
          </motion.button>
        ) : (
          <div className="h-9 w-9 shrink-0" aria-hidden />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-7 pb-2 pt-2">
        <motion.h1
          initial={false}
          className="max-w-full text-[26px] font-black uppercase leading-[1.12] tracking-[-0.035em] min-[360px]:text-[30px] min-[390px]:text-[34px]"
          style={{ color: PALETTE.text, WebkitTextSizeAdjust: "100%" }}
        >
          {t.title}
        </motion.h1>

        <motion.div className="relative mt-7 space-y-5 min-[390px]:mt-8 min-[390px]:space-y-6">
          <div className="absolute left-[15px] top-8 bottom-8 border-l-[3px] border-dashed border-black" aria-hidden />
          {steps.map((text, index) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.09, duration: 0.35 }}
              className="relative flex gap-4"
            >
              <div
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center"
                style={{ backgroundColor: PALETTE.primary }}
              >
                <Check className="h-5 w-5 text-white" strokeWidth={4} />
              </div>
              <p
                className="pt-0.5 text-[17px] font-semibold leading-relaxed tracking-[-0.02em] min-[390px]:text-[18px]"
                style={{
                  color: index === 0 ? PALETTE.text : PALETTE.muted,
                  WebkitTextSizeAdjust: "100%",
                }}
              >
                {text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="shrink-0 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)] pt-2">
        <div className="flex w-full overflow-hidden rounded-[25px] border-[3px] border-neutral-950 bg-white">
          <button
            type="button"
            onClick={() => choose(false)}
            className="flex h-[54px] min-w-0 flex-1 items-center justify-center bg-white px-3 text-[17px] font-medium tracking-[-0.02em] text-neutral-950"
          >
            {t.notNow}
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="flex h-[54px] min-w-0 flex-1 items-center justify-center px-3 text-[17px] font-medium tracking-[-0.02em] text-white"
            style={{
              backgroundColor: PALETTE.primary,
            }}
          >
            {t.enable}
          </button>
        </div>
      </div>
    </div>
  );
}
