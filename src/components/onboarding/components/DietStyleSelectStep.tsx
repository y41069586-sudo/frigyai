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
  primary: "#6EF0A8",
  primaryDark: "#4AE896",
  bg: "#FEFFFE",
  selectedBg: "#E0FDEC",
  border: "#6EECC0",
  text: "#1F2937",
  cardBorderIdle: "#D1D5DB",
};

type DietId =
  | "balanced"
  | "vegan"
  | "vegetarian"
  | "keto"
  | "low-carb"
  | "paleo";

export function DietStyleSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Wie ist dein Ernährungsziel?",
      balanced: { title: "Ausgewogene Ernährung" },
      vegan: { title: "Vegan" },
      vegetarian: { title: "Vegetarisch" },
      keto: { title: "Keto-Diät" },
      lowCarb: { title: "Kohlenhydratarme Diät" },
      paleo: { title: "Paleo-Diät" },
    },
    en: {
      title: "What's your dietary goal?",
      balanced: { title: "Balanced nutrition" },
      vegan: { title: "Vegan" },
      vegetarian: { title: "Vegetarian" },
      keto: { title: "Keto" },
      lowCarb: { title: "Low-carb" },
      paleo: { title: "Paleo" },
    },
    fr: {
      title: "Quel est ton objectif alimentaire ?",
      balanced: { title: "Alimentation équilibrée" },
      vegan: { title: "Végan" },
      vegetarian: { title: "Végétarien" },
      keto: { title: "Cétogène" },
      lowCarb: { title: "Faible en glucides" },
      paleo: { title: "Paléo" },
    },
  } as const;

  const L = labels[(language as "de" | "en" | "fr")] ?? labels.de;

  const options: { id: DietId; title: string; emoji: string }[] = [
    { id: "balanced", title: L.balanced.title, emoji: "🥗" },
    { id: "vegan", title: L.vegan.title, emoji: "🌱" },
    {
      id: "vegetarian",
      title: L.vegetarian.title,
      emoji: "🧀",
    },
    { id: "keto", title: L.keto.title, emoji: "🥩" },
    { id: "low-carb", title: L.lowCarb.title, emoji: "🥑" },
    { id: "paleo", title: L.paleo.title, emoji: "🍖" },
  ];

  const selectedId = (userData.dietaryPreferences?.[0] ?? null) as DietId | null;
  const canProceed = selectedId !== null;

  const select = (id: DietId) => {
    setUserData({ ...userData, dietaryPreferences: [id] });
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
              backgroundColor: "#F5FFF9",
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
      <div className="mt-6 grid flex-1 min-h-0 grid-cols-2 gap-2.5 overflow-y-auto px-5 pb-2 pt-1 content-start">
        {options.map((opt, i) => {
          const isSelected = selectedId === opt.id;
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
              onClick={() => select(opt.id)}
              aria-pressed={isSelected}
              className="relative flex min-h-[104px] flex-col items-stretch justify-between gap-2 rounded-[18px] px-3 py-3 text-left transition-all duration-200"
              style={{
                backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${isSelected ? PALETTE.primary : PALETTE.cardBorderIdle}`,
                boxShadow: isSelected
                  ? "0 8px 24px -10px rgba(110, 240, 168,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[18px] transition-colors"
                  style={{
                    backgroundColor: isSelected ? "#C0FFD9" : "#EAFFF5",
                  }}
                  aria-hidden
                >
                  <span>{opt.emoji}</span>
                </div>
                <motion.span
                  initial={false}
                  animate={{
                    scale: isSelected ? 1 : 0.6,
                    opacity: isSelected ? 1 : 0,
                  }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: PALETTE.primary,
                    boxShadow: "0 4px 10px -3px rgba(110, 240, 168,0.6)",
                  }}
                  aria-hidden
                >
                  <Check className="size-3.5 text-white" strokeWidth={3} />
                </motion.span>
              </div>
              <span
                className="line-clamp-2 text-[13px] font-medium leading-snug tracking-tight"
                style={{ color: PALETTE.text }}
              >
                {opt.title}
              </span>
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
