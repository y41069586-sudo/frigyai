import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#20D86B",
  primaryDark: "#0EA84E",
  bg: "#FAFFF5",
  selectedBg: "#BFF4D4",
  border: "#6EECC0",
  text: "#1F2937",
  cardBorderIdle: "#D1D5DB",
};

type GoalId =
  | "fitness"
  | "performance"
  | "anti-inflammatory"
  | "energy"
  | "pregnancy"
  | "digestion";

export function HealthGoalsSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Was möchtest du erreichen?",
      fitness: { title: "Fitness & Straffung" },
      performance: { title: "Sportliche Leistung verbessern" },
      antiInflammatory: { title: "Entzündungshemmende Ernährung" },
      energy: { title: "Energie steigern" },
      pregnancy: { title: "Ernährung während der Schwangerschaft" },
      digestion: { title: "Verdauungsgesundheit verbessern" },
    },
    en: {
      title: "What do you want to achieve?",
      fitness: { title: "Fitness & toning" },
      performance: { title: "Improve athletic performance" },
      antiInflammatory: { title: "Anti-inflammatory eating" },
      energy: { title: "Boost energy" },
      pregnancy: { title: "Pregnancy nutrition" },
      digestion: { title: "Improve digestive health" },
    },
    fr: {
      title: "Que veux-tu atteindre ?",
      fitness: { title: "Fitness & tonification" },
      performance: { title: "Améliorer la performance sportive" },
      antiInflammatory: { title: "Alimentation anti-inflammatoire" },
      energy: { title: "Booster l'énergie" },
      pregnancy: { title: "Nutrition pendant la grossesse" },
      digestion: { title: "Améliorer la digestion" },
    },
  } as const;

  const L = labels[(language as "de" | "en" | "fr")] ?? labels.de;

  const options: { id: GoalId; title: string; emoji: string }[] = [
    { id: "fitness", title: L.fitness.title, emoji: "🏋️" },
    {
      id: "performance",
      title: L.performance.title,
      emoji: "⚡",
    },
    {
      id: "anti-inflammatory",
      title: L.antiInflammatory.title,
      emoji: "🌿",
    },
    { id: "energy", title: L.energy.title, emoji: "🔋" },
    {
      id: "pregnancy",
      title: L.pregnancy.title,
      emoji: "🤰",
    },
    {
      id: "digestion",
      title: L.digestion.title,
      emoji: "✨",
    },
  ];

  const selected = userData.healthGoals ?? [];
  const canProceed = selected.length > 0;

  const toggle = (id: GoalId) => {
    const has = selected.includes(id);
    const next = has ? selected.filter((s) => s !== id) : [...selected, id];
    setUserData({ ...userData, healthGoals: next });
  };

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
              backgroundColor: "#E9FFF1",
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

      {/* Option cards (scrollable) */}
      <div className="mt-6 flex flex-1 min-h-0 flex-col gap-2.5 overflow-y-auto px-5 pb-2 pt-1">
        {options.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
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
                opacity: { delay: 0.05 + i * 0.05, duration: 0.32 },
                y: { delay: 0.05 + i * 0.05, duration: 0.32 },
                scale: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{ scale: isSelected ? 1.0 : 0.985 }}
              onClick={() => toggle(opt.id)}
              aria-pressed={isSelected}
              className="relative flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-all duration-200"
              style={{
                backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${isSelected ? PALETTE.primary : PALETTE.cardBorderIdle}`,
                boxShadow: isSelected
                  ? "0 8px 24px -10px rgba(32,216,107,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[20px] transition-colors"
                style={{
                  backgroundColor: isSelected ? "#C0FFD9" : "#EAFFF5",
                }}
                aria-hidden
              >
                <span>{opt.emoji}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className="text-[15px] font-medium tracking-tight"
                  style={{ color: PALETTE.text }}
                >
                  {opt.title}
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
                  boxShadow: "0 4px 10px -3px rgba(32,216,107,0.6)",
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
          onClick={canProceed ? onNext : undefined}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #BEF5D8 0%, #98EBC5 100%)",
            boxShadow: canProceed
              ? "0 16px 34px -10px rgba(14,168,78,0.72), 0 0 34px rgba(32,216,107,0.36), 0 2px 4px rgba(15,40,30,0.05)"
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
