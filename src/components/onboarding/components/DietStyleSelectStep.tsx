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
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Wie ist dein Ernährungsziel?",
      subtitle: "Wähle den Stil, der am besten zu deinem Lebensstil passt.",
      balanced: { title: "Ausgewogene Ernährung", sub: "Alles in Maßen" },
      vegan: { title: "Vegan", sub: "Rein pflanzlich" },
      vegetarian: { title: "Vegetarisch", sub: "Ohne Fleisch & Fisch" },
      keto: { title: "Keto-Diät", sub: "Sehr wenig Kohlenhydrate" },
      lowCarb: { title: "Kohlenhydratarme Diät", sub: "Weniger Kohlenhydrate" },
      paleo: { title: "Paleo-Diät", sub: "Wie in der Steinzeit" },
    },
    en: {
      title: "What's your dietary goal?",
      subtitle: "Pick the style that fits your lifestyle best.",
      balanced: { title: "Balanced nutrition", sub: "Everything in moderation" },
      vegan: { title: "Vegan", sub: "Plant-based only" },
      vegetarian: { title: "Vegetarian", sub: "No meat or fish" },
      keto: { title: "Keto", sub: "Very low carb" },
      lowCarb: { title: "Low-carb", sub: "Reduced carbs" },
      paleo: { title: "Paleo", sub: "Stone-age style" },
    },
    fr: {
      title: "Quel est ton objectif alimentaire ?",
      subtitle: "Choisis le style qui correspond le mieux à ton mode de vie.",
      balanced: { title: "Alimentation équilibrée", sub: "Tout avec modération" },
      vegan: { title: "Végan", sub: "100 % végétal" },
      vegetarian: { title: "Végétarien", sub: "Sans viande ni poisson" },
      keto: { title: "Cétogène", sub: "Très peu de glucides" },
      lowCarb: { title: "Faible en glucides", sub: "Moins de glucides" },
      paleo: { title: "Paléo", sub: "Style préhistorique" },
    },
  } as const;

  const L = labels[(language as "de" | "en" | "fr")] ?? labels.de;

  const options: { id: DietId; title: string; sub: string; emoji: string }[] = [
    { id: "balanced", title: L.balanced.title, sub: L.balanced.sub, emoji: "🥗" },
    { id: "vegan", title: L.vegan.title, sub: L.vegan.sub, emoji: "🌱" },
    {
      id: "vegetarian",
      title: L.vegetarian.title,
      sub: L.vegetarian.sub,
      emoji: "🧀",
    },
    { id: "keto", title: L.keto.title, sub: L.keto.sub, emoji: "🥩" },
    { id: "low-carb", title: L.lowCarb.title, sub: L.lowCarb.sub, emoji: "🥑" },
    { id: "paleo", title: L.paleo.title, sub: L.paleo.sub, emoji: "🍖" },
  ];

  const selectedId = (userData.dietaryPreferences?.[0] ?? null) as DietId | null;
  const canProceed = selectedId !== null;

  const select = (id: DietId) => {
    setUserData({ ...userData, dietaryPreferences: [id] });
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

      {/* Option cards */}
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-5 pb-2">
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
