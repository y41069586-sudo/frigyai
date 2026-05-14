import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
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
  primaryDeep: "#2DAA82",
  bg: "#F7FFFB",
  accent: "#E8FFF4",
  border: "#B7F0D7",
  text: "#1F2937",
  textMuted: "#6B7280",
  subtext: "#7C9388",
  cardBorderIdle: "#EEF2EF",
  pageLine: "#EDF7F1",
};

type Lng = "de" | "en" | "fr";

const ITEMS: { emoji: string; label: Record<Lng, string> }[] = [
  { emoji: "🥛", label: { de: "Bio-Hafermilch", en: "Organic oat milk", fr: "Lait d'avoine bio" } },
  { emoji: "🥑", label: { de: "Avocados", en: "Avocados", fr: "Avocats" } },
  { emoji: "🐟", label: { de: "Lachsfilet", en: "Salmon fillet", fr: "Filet de saumon" } },
  { emoji: "🥗", label: { de: "Rucola-Salat", en: "Rocket salad", fr: "Salade de roquette" } },
  { emoji: "🌾", label: { de: "Quinoa", en: "Quinoa", fr: "Quinoa" } },
  { emoji: "🍓", label: { de: "Bio-Beeren", en: "Organic berries", fr: "Baies bio" } },
];

function ShoppingListCard({ lng }: { lng: Lng }) {
  const headerLabel = {
    de: "Meine Einkaufsliste",
    en: "My shopping list",
    fr: "Ma liste de courses",
  }[lng];
  const countLabel = {
    de: `${ITEMS.length} Artikel`,
    en: `${ITEMS.length} items`,
    fr: `${ITEMS.length} articles`,
  }[lng];
  return (
    <div
      className="relative"
      style={{ width: 286, height: 360 }}
    >
      {/* Soft floor glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          bottom: 4,
          transform: "translateX(-50%)",
          width: 220,
          height: 22,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(91,203,159,0.22) 0%, rgba(91,203,159,0) 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Clipboard clip on top */}
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute left-1/2"
        style={{
          top: 6,
          width: 70,
          height: 24,
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, #BCF1DA 0%, #7BE0B8 100%)",
          borderRadius: 8,
          boxShadow:
            "0 6px 14px -4px rgba(91,203,159,0.55), inset 0 1px 1px rgba(255,255,255,0.6)",
        }}
      >
        {/* Inner notch */}
        <div
          className="absolute left-1/2 rounded-md"
          style={{
            top: 6,
            transform: "translateX(-50%)",
            width: 40,
            height: 8,
            background: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        />
      </motion.div>

      {/* Card body */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute inset-x-0 mx-auto overflow-hidden rounded-[22px]"
        style={{
          top: 22,
          width: 286,
          height: 332,
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFFFC 100%)",
          border: `1px solid ${PALETTE.cardBorderIdle}`,
          boxShadow:
            "0 26px 60px -28px rgba(60,120,90,0.30), 0 6px 16px -8px rgba(60,120,90,0.10)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, #BCF1DA 0%, #7BE0B8 100%)",
                color: "#fff",
                boxShadow:
                  "0 6px 14px -5px rgba(91,203,159,0.55), inset 0 1px 1px rgba(255,255,255,0.6)",
              }}
            >
              <ClipboardList className="size-5" strokeWidth={2.2} />
              {/* Writing dot pulse on top-right of icon */}
              <motion.span
                className="absolute h-1.5 w-1.5 rounded-full bg-white"
                style={{
                  top: 4,
                  right: 4,
                  boxShadow: "0 0 6px rgba(255,255,255,0.95)",
                }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
            <div className="flex flex-col">
              <span
                className="text-[14px] font-semibold tracking-tight"
                style={{ color: PALETTE.text }}
              >
                {headerLabel}
              </span>
              <span
                className="text-[11px]"
                style={{ color: PALETTE.subtext }}
              >
                {countLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-5"
          style={{ height: 1, background: PALETTE.pageLine }}
        />

        {/* Items list */}
        <div className="flex flex-col gap-2 px-5 pt-3 pb-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.emoji}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.55 + i * 0.13,
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex items-center gap-2.5"
            >
              {/* Check pill */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.65 + i * 0.13,
                  duration: 0.3,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #7BE0B8 0%, #5BCB9F 100%)",
                  boxShadow:
                    "0 4px 10px -3px rgba(91,203,159,0.55), inset 0 1px 1px rgba(255,255,255,0.5)",
                }}
              >
                <Check className="size-3.5 text-white" strokeWidth={3} />
              </motion.div>
              {/* Emoji chip */}
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[15px]"
                style={{
                  background: PALETTE.accent,
                  border: `1px solid ${PALETTE.border}`,
                }}
                aria-hidden
              >
                {item.emoji}
              </span>
              <span
                className="flex-1 truncate text-[13.5px] font-semibold tracking-tight"
                style={{ color: PALETTE.text }}
              >
                {item.label[lng]}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function ShoppingListStep({
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language } = useLanguage();
  const lng: Lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as Lng)
    : "de";

  const L = {
    de: {
      title: "Einkaufsliste generieren",
      subtitle:
        "Basierend auf deinem Kühlschrank-Scan erstellen wir dir eine Liste mit den fehlenden Zutaten für deine Woche.",
      next: "Weiter",
      back: "Zurück",
    },
    en: {
      title: "Generate your shopping list",
      subtitle:
        "Based on your fridge scan, we'll create a list with the missing ingredients for your week.",
      next: "Next",
      back: "Back",
    },
    fr: {
      title: "Générer ta liste de courses",
      subtitle:
        "À partir du scan de ton frigo, nous créons une liste avec les ingrédients manquants pour ta semaine.",
      next: "Suivant",
      back: "Retour",
    },
  } as const;
  const t = L[lng];

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
            aria-label={t.back}
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
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-6 pb-2 shrink-0"
      >
        <h1
          className="text-[24px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {t.title}
        </h1>
        <p
          className="mt-2.5 text-[14.5px] leading-relaxed"
          style={{ color: PALETTE.textMuted }}
        >
          {t.subtitle}
        </p>
      </motion.div>

      {/* Hero: shopping list card */}
      <div className="flex flex-1 min-h-0 items-center justify-center px-5">
        <ShoppingListCard lng={lng} />
      </div>

      {/* Continue */}
      <div className="shrink-0 px-5 pt-2 pb-10">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            boxShadow:
              "0 10px 24px -8px rgba(91,203,159,0.55), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
