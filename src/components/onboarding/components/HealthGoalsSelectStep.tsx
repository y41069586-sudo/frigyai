import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";

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
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Was möchtest du erreichen?",
      subtitle:
        "Wähle aus, was dir am wichtigsten ist (Mehrfachauswahl möglich).",
      fitness: {
        title: "Fitness & Straffung",
        sub: "Definierter, straffer Körper",
      },
      performance: {
        title: "Sportliche Leistung verbessern",
        sub: "Mehr Power & Ausdauer",
      },
      antiInflammatory: {
        title: "Entzündungshemmende Ernährung",
        sub: "Sanft für Körper & Darm",
      },
      energy: {
        title: "Energie steigern",
        sub: "Mehr Fokus durch den Tag",
      },
      pregnancy: {
        title: "Ernährung während der Schwangerschaft",
        sub: "Sicher & nährstoffreich",
      },
      digestion: {
        title: "Verdauungsgesundheit verbessern",
        sub: "Leichter & ausgeglichener",
      },
    },
    en: {
      title: "What do you want to achieve?",
      subtitle: "Pick what matters most (multiple choices possible).",
      fitness: { title: "Fitness & toning", sub: "Defined, toned body" },
      performance: {
        title: "Improve athletic performance",
        sub: "More power & endurance",
      },
      antiInflammatory: {
        title: "Anti-inflammatory eating",
        sub: "Gentle for body & gut",
      },
      energy: { title: "Boost energy", sub: "More focus through the day" },
      pregnancy: {
        title: "Pregnancy nutrition",
        sub: "Safe & nutrient-rich",
      },
      digestion: {
        title: "Improve digestive health",
        sub: "Lighter & more balanced",
      },
    },
    fr: {
      title: "Que veux-tu atteindre ?",
      subtitle: "Choisis ce qui compte le plus (sélection multiple possible).",
      fitness: { title: "Fitness & tonification", sub: "Corps défini et tonique" },
      performance: {
        title: "Améliorer la performance sportive",
        sub: "Plus de puissance & d'endurance",
      },
      antiInflammatory: {
        title: "Alimentation anti-inflammatoire",
        sub: "Douce pour le corps et l'intestin",
      },
      energy: { title: "Booster l'énergie", sub: "Plus de focus chaque jour" },
      pregnancy: {
        title: "Nutrition pendant la grossesse",
        sub: "Sûre & riche en nutriments",
      },
      digestion: {
        title: "Améliorer la digestion",
        sub: "Plus légère & équilibrée",
      },
    },
  } as const;

  const L = labels[(language as "de" | "en" | "fr")] ?? labels.de;

  const options: { id: GoalId; title: string; sub: string; emoji: string }[] = [
    { id: "fitness", title: L.fitness.title, sub: L.fitness.sub, emoji: "🏋️" },
    {
      id: "performance",
      title: L.performance.title,
      sub: L.performance.sub,
      emoji: "⚡",
    },
    {
      id: "anti-inflammatory",
      title: L.antiInflammatory.title,
      sub: L.antiInflammatory.sub,
      emoji: "🌿",
    },
    { id: "energy", title: L.energy.title, sub: L.energy.sub, emoji: "🔋" },
    {
      id: "pregnancy",
      title: L.pregnancy.title,
      sub: L.pregnancy.sub,
      emoji: "🤰",
    },
    {
      id: "digestion",
      title: L.digestion.title,
      sub: L.digestion.sub,
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
        className="px-6 pt-8 pb-6 shrink-0"
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

      {/* Option cards (scrollable) */}
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-5 pb-2">
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
              className="relative flex w-full items-center gap-4 rounded-[20px] px-5 py-4 text-left transition-all duration-200"
              style={{
                backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${isSelected ? PALETTE.primary : PALETTE.cardBorderIdle}`,
                boxShadow: isSelected
                  ? "0 8px 24px -10px rgba(123,224,184,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[22px] transition-colors"
                style={{
                  backgroundColor: isSelected ? "#D6F8E8" : "#F2FAF6",
                }}
                aria-hidden
              >
                <span>{opt.emoji}</span>
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
      <div className="shrink-0 px-5 pt-4 pb-10">
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={canProceed ? onNext : undefined}
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
