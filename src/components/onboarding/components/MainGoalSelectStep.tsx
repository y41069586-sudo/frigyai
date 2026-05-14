import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";

type GoalId = "lose" | "maintain" | "gain";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalSteps?: number;
};

const PALETTE = {
  primary: "#7BE0B8",
  primaryDark: "#5BCB9F",
  bg: "#F7FFFB",
  selectedBg: "#E8FFF4",
  border: "#B7F0D7",
  text: "#1F2937",
  textMuted: "#6B7280",
  subtext: "#7C9388",
  cardBorderIdle: "#EEF2EF",
};

export function MainGoalSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Was ist dein Ziel?",
      subtitle: "Wir passen deine Reise individuell an deine Wünsche an.",
      lose: { title: "Gewicht abnehmen", sub: "In deinem eigenen Tempo" },
      maintain: { title: "Gewicht beibehalten", sub: "Gesund & ausgeglichen" },
      gain: { title: "Gewicht zulegen", sub: "Stark & kontrolliert aufbauen" },
    },
    en: {
      title: "What's your goal?",
      subtitle: "We'll tailor your journey to what you want.",
      lose: { title: "Lose weight", sub: "At your own pace" },
      maintain: { title: "Maintain weight", sub: "Healthy & balanced" },
      gain: { title: "Gain weight", sub: "Build strength steadily" },
    },
    fr: {
      title: "Quel est ton objectif ?",
      subtitle: "Nous adapterons ton parcours à tes envies.",
      lose: { title: "Perdre du poids", sub: "À ton propre rythme" },
      maintain: { title: "Maintenir le poids", sub: "Sain et équilibré" },
      gain: { title: "Prendre du poids", sub: "Construire progressivement" },
    },
  } as const;

  const L = labels[language as "de" | "en" | "fr"] ?? labels.de;

  const options: {
    id: GoalId;
    title: string;
    sub: string;
    Icon: LucideIcon;
  }[] = [
    { id: "lose", title: L.lose.title, sub: L.lose.sub, Icon: TrendingDown },
    { id: "maintain", title: L.maintain.title, sub: L.maintain.sub, Icon: Minus },
    { id: "gain", title: L.gain.title, sub: L.gain.sub, Icon: TrendingUp },
  ];

  const selected = userData.goalMode ?? null;
  const canProceed =
    selected === "lose" || selected === "maintain" || selected === "gain";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2 shrink-0">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#EAF8F1",
              color: PALETTE.primaryDark,
              boxShadow: "0 1px 2px rgba(15,40,30,0.04)",
            }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </motion.button>
        ) : (
          <div className="h-9 w-9 shrink-0" />
        )}
        <div className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-[4px] flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: i <= currentIndex ? PALETTE.primary : "#E5F4EC",
              }}
            />
          ))}
        </div>
        <div className="h-9 w-9 shrink-0" />
      </div>

      {/* Title + subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-10 pb-8 shrink-0"
      >
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {L.title}
        </h1>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ color: PALETTE.textMuted }}
        >
          {L.subtitle}
        </p>
      </motion.div>

      {/* Option cards */}
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-5">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          const Icon = opt.Icon;
          return (
            <motion.button
              key={opt.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isSelected ? 1.02 : 1,
              }}
              transition={{
                opacity: { delay: 0.08 + i * 0.06, duration: 0.35 },
                y: { delay: 0.08 + i * 0.06, duration: 0.35 },
                scale: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{ scale: isSelected ? 1.0 : 0.985 }}
              onClick={() => setUserData({ ...userData, goalMode: opt.id })}
              className="relative flex w-full items-center gap-4 rounded-[20px] px-5 py-4 text-left transition-all duration-200"
              style={{
                backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${isSelected ? PALETTE.border : PALETTE.cardBorderIdle}`,
                boxShadow: isSelected
                  ? "0 8px 24px -10px rgba(123,224,184,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors"
                style={{
                  backgroundColor: isSelected ? "#D6F8E8" : "#F2FAF6",
                  color: PALETTE.primaryDark,
                }}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={2.2} />
              </div>
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
                  boxShadow: "0 4px 10px -3px rgba(123,224,184,0.6)",
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
      <div className="shrink-0 px-5 pt-6 pb-10">
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={onNext}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #CFEEDD 0%, #BCE3CE 100%)",
            boxShadow: canProceed
              ? "0 10px 24px -8px rgba(91,203,159,0.55), 0 2px 4px rgba(15,40,30,0.05)"
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
