import { motion } from "framer-motion";
import { Armchair, Check, ChevronLeft, ChevronRight, Dumbbell, Footprints, Zap, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";

type ActivityId = "sedentary" | "light" | "moderate" | "active";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  primaryDeep: "#2EB56D",
  bg: "#FBFFFD",
  selectedBg: "#DCFEEF",
  iconBgIdle: "#EAFFF5",
  iconBgSelected: "#C0FFD9",
  border: "#6EECC0",
  text: "#1F2937",
  subtext: "#7C9388",
  cardBorderIdle: "#D1D5DB",
};

export function ActivitySelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Wie aktiv bist du?",
      sedentary: { title: "Wenig aktiv", sub: "0 Tage pro Woche" },
      light: { title: "Leicht aktiv", sub: "1–2 Tage pro Woche" },
      moderate: { title: "Aktiv", sub: "3–5 Tage pro Woche" },
      active: { title: "Sehr aktiv", sub: "6–7 Tage pro Woche" },
    },
    en: {
      title: "How active are you?",
      sedentary: { title: "Not active", sub: "0 days per week" },
      light: { title: "Lightly active", sub: "1–2 days per week" },
      moderate: { title: "Active", sub: "3–5 days per week" },
      active: { title: "Very active", sub: "6–7 days per week" },
    },
    fr: {
      title: "Quel est ton niveau d'activité ?",
      sedentary: { title: "Peu actif", sub: "0 jours par semaine" },
      light: { title: "Légèrement actif", sub: "1–2 jours par semaine" },
      moderate: { title: "Actif", sub: "3–5 jours par semaine" },
      active: { title: "Très actif", sub: "6–7 jours par semaine" },
    },
  } as const;

  const L = labels[language as "de" | "en" | "fr"] ?? labels.de;

  const options: { id: ActivityId; title: string; sub: string; icon: LucideIcon }[] = [
    { id: "sedentary", title: L.sedentary.title, sub: L.sedentary.sub, icon: Armchair },
    { id: "light", title: L.light.title, sub: L.light.sub, icon: Footprints },
    { id: "moderate", title: L.moderate.title, sub: L.moderate.sub, icon: Dumbbell },
    { id: "active", title: L.active.title, sub: L.active.sub, icon: Zap },
  ];

  const selected = (userData.activityLevel ?? null) as ActivityId | null;
  const canProceed = selected !== null;

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Top bar: back + progress */}
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+1.375rem)]">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#FBFFFD",
              color: PALETTE.primaryDark,
              boxShadow: "0 1px 2px rgba(15,40,30,0.04)",
            }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </motion.button>
        ) : (
          <div className="h-9 w-9 shrink-0" />
        )}
</div>

      <OnboardingMascotQuestion>
        <h1
          className="text-[19px] font-semibold leading-snug tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {L.title}
        </h1>
      </OnboardingMascotQuestion>

      {/* Option cards */}
      <div className="mt-6 flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-5 pt-1">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.id}
              type="button"
              initial={false}
              animate={{
                scale: isSelected ? 1.02 : 1,
              }}
              transition={{
                scale: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{ scale: isSelected ? 1.0 : 0.985 }}
              onClick={() =>
                setUserData({ ...userData, activityLevel: opt.id })
              }
              className="relative flex w-full items-center gap-4 rounded-[20px] px-5 py-4 text-left transition-all duration-200"
              style={{
                backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${isSelected ? PALETTE.border : PALETTE.cardBorderIdle}`,
                boxShadow: isSelected
                  ? "0 8px 24px -10px rgba(110, 240, 168,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <motion.span
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12 + i * 0.06, duration: 0.25 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors"
                style={{
                  backgroundColor: isSelected ? PALETTE.iconBgSelected : PALETTE.iconBgIdle,
                  color: isSelected ? PALETTE.primaryDeep : PALETTE.primaryDark,
                  boxShadow: isSelected
                    ? "0 4px 12px -6px rgba(110, 240, 168,0.45)"
                    : "0 1px 2px rgba(15,40,30,0.04)",
                }}
                aria-hidden
              >
                <Icon className="size-6" strokeWidth={2.4} />
              </motion.span>
              <div className="flex flex-1 flex-col">
                <span
                  className="text-[16px] font-medium tracking-tight"
                  style={{ color: PALETTE.text }}
                >
                  {opt.title}
                </span>
                <span
                  className="mt-1 text-[13px]"
                  style={{ color: PALETTE.subtext }}
                >
                  {opt.sub}
                </span>
              </div>
              <motion.span
                initial={false}
                animate={{
                  scale: isSelected ? 1 : 0.6,
                  opacity: isSelected ? 1 : 0,
                }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: PALETTE.primary,
                  boxShadow: "0 4px 10px -3px rgba(110, 240, 168,0.6)",
                }}
                aria-hidden
              >
                <Check className="size-4 text-white" strokeWidth={3} />
              </motion.span>
            </motion.button>
          );
        })}
      </div>

      {/* Continue */}
      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <OnboardingDataNotice variant="mint" className="mb-3" />
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={onNext}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #BEF5D8 0%, #98EBC5 100%)",
            boxShadow: canProceed
              ? "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)"
              : "0 1px 2px rgba(15,40,30,0.04)",
            cursor: canProceed ? "pointer" : "not-allowed",
            opacity: canProceed ? 1 : 0.85,
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
