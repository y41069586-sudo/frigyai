import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";

type GoalId = "lose" | "maintain" | "gain";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#F2FFF8",
  selectedBg: "#DCFEEF",
  border: "#6EECC0",
  text: "#1F2937",
  textMuted: "#6B7280",
  cardBorderIdle: "#D1D5DB",
};

export function MainGoalSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Was ist dein Ziel?",
      lose: { a: "Gewicht", b: "abnehmen" },
      maintain: { a: "Gewicht", b: "beibehalten" },
      gain: { a: "Gewicht", b: "zulegen" },
    },
    en: {
      title: "What's your goal?",
      lose: { a: "Lose", b: "weight" },
      maintain: { a: "Maintain", b: "weight" },
      gain: { a: "Gain", b: "weight" },
    },
    fr: {
      title: "Quel est ton objectif ?",
      lose: { a: "Perdre", b: "du poids" },
      maintain: { a: "Maintenir", b: "le poids" },
      gain: { a: "Prendre", b: "du poids" },
    },
  } as const;

  const L = labels[language as "de" | "en" | "fr"] ?? labels.de;

  const options: {
    id: GoalId;
    titleA: string;
    titleB: string;
    Icon: LucideIcon;
  }[] = [
    { id: "lose", titleA: L.lose.a, titleB: L.lose.b, Icon: Flame },
    { id: "maintain", titleA: L.maintain.a, titleB: L.maintain.b, Icon: Scale },
    { id: "gain", titleA: L.gain.a, titleB: L.gain.b, Icon: Dumbbell },
  ];

  const selected = userData.goalMode ?? null;
  const canProceed =
    selected === "lose" || selected === "maintain" || selected === "gain";

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+1.375rem)]">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#F2FFF8",
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
      <motion.div className="mx-auto mt-2 flex w-full max-w-[340px] flex-1 min-h-0 flex-col justify-center gap-2.5 overflow-y-auto px-5 pb-2">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          const Icon = opt.Icon;
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
              onClick={() => setUserData({ ...userData, goalMode: opt.id })}
              className="relative flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-all duration-200"
              style={{
                backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${isSelected ? PALETTE.border : PALETTE.cardBorderIdle}`,
                boxShadow: isSelected
                  ? "0 8px 24px -10px rgba(110, 240, 168,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors"
                style={{
                  backgroundColor: isSelected ? "#C0FFD9" : "#EAFFF5",
                  color: PALETTE.primaryDark,
                }}
                aria-hidden
              >
                <Icon className="size-[18px]" strokeWidth={2.2} />
              </div>
              <div className="flex min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <span
                  className="text-[15px] font-medium tracking-tight"
                  style={{ color: PALETTE.text }}
                >
                  {opt.titleA}
                </span>
                <span
                  className="text-[15px] font-semibold tracking-tight"
                  style={{ color: PALETTE.text }}
                >
                  {opt.titleB}
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
      </motion.div>

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
