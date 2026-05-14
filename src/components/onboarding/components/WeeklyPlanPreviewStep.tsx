import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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

const ENTRIES: { emoji: string; label: Record<Lng, string> }[] = [
  { emoji: "🥗", label: { de: "Quinoa-Bowl", en: "Quinoa bowl", fr: "Bol de quinoa" } },
  { emoji: "🥑", label: { de: "Avocado-Toast", en: "Avocado toast", fr: "Toast à l'avocat" } },
  { emoji: "🍗", label: { de: "Hähnchen-Wrap", en: "Chicken wrap", fr: "Wrap au poulet" } },
  { emoji: "🍓", label: { de: "Beeren-Smoothie", en: "Berry smoothie", fr: "Smoothie aux baies" } },
];

function MealNotebook({ headerTitle, lng }: { headerTitle: string; lng: Lng }) {
  return (
    <div className="relative" style={{ width: 260, height: 290 }}>
      {/* Soft floor shadow */}
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: 6,
          transform: "translateX(-50%)",
          width: 180,
          height: 18,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(91,203,159,0.22) 0%, rgba(91,203,159,0) 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Floating food emojis around the book */}
      <motion.span
        className="absolute select-none text-[28px]"
        style={{ top: 4, left: -6 }}
        initial={{ opacity: 0, y: 8, rotate: -8 }}
        animate={{ opacity: 1, y: [0, -6, 0], rotate: -8 }}
        transition={{
          opacity: { delay: 0.35, duration: 0.35 },
          y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
        }}
        aria-hidden
      >
        🥑
      </motion.span>
      <motion.span
        className="absolute select-none text-[26px]"
        style={{ top: -2, right: -4 }}
        initial={{ opacity: 0, y: 8, rotate: 10 }}
        animate={{ opacity: 1, y: [0, -5, 0], rotate: 10 }}
        transition={{
          opacity: { delay: 0.45, duration: 0.35 },
          y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
        }}
        aria-hidden
      >
        🥕
      </motion.span>
      <motion.span
        className="absolute select-none text-[24px]"
        style={{ bottom: 38, left: -10 }}
        initial={{ opacity: 0, y: -8, rotate: -4 }}
        animate={{ opacity: 1, y: [0, 6, 0], rotate: -4 }}
        transition={{
          opacity: { delay: 0.55, duration: 0.35 },
          y: { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
        }}
        aria-hidden
      >
        🍅
      </motion.span>
      <motion.span
        className="absolute select-none text-[24px]"
        style={{ bottom: 30, right: -8 }}
        initial={{ opacity: 0, y: -8, rotate: 14 }}
        animate={{ opacity: 1, y: [0, 5, 0], rotate: 14 }}
        transition={{
          opacity: { delay: 0.5, duration: 0.35 },
          y: { duration: 4.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
        }}
        aria-hidden
      >
        🥦
      </motion.span>

      {/* Notebook */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute inset-x-0 mx-auto"
        style={{
          width: 220,
          height: 256,
          top: 14,
          left: 0,
          right: 0,
          transformOrigin: "center",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* Back layer (page behind) */}
        <div
          className="absolute inset-0 rounded-[18px]"
          style={{
            background: "#F1FBF6",
            transform: "translate(4px, 4px)",
            border: `1px solid ${PALETTE.cardBorderIdle}`,
            boxShadow: "0 14px 30px -16px rgba(60,120,90,0.20)",
          }}
        />
        {/* Page */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[18px]"
          style={{
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #FAFFFC 100%)",
            border: `1px solid ${PALETTE.cardBorderIdle}`,
            boxShadow:
              "0 22px 50px -24px rgba(60,120,90,0.30), 0 4px 12px -6px rgba(60,120,90,0.08)",
          }}
        >
          {/* Spiral binding stripe */}
          <div
            className="absolute left-0 top-0 h-full"
            style={{
              width: 22,
              background:
                "linear-gradient(180deg, #BCF1DA 0%, #7BE0B8 100%)",
            }}
          />
          {/* Spiral rings */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: 6,
                top: 22 + i * 28,
                width: 10,
                height: 10,
                background: "#FFFFFF",
                border: "2px solid #5BCB9F",
                boxShadow: "inset 0 1px 1px rgba(15,40,30,0.1)",
              }}
            />
          ))}

          {/* Page content (everything to the right of the binding) */}
          <div className="absolute" style={{ left: 36, right: 16, top: 18, bottom: 16 }}>
            {/* Title row with sparkle */}
            <div className="flex items-center gap-1.5 pb-2">
              <Sparkles
                className="size-4"
                strokeWidth={2.4}
                style={{ color: PALETTE.primaryDark }}
              />
              <span
                className="text-[14px] font-semibold tracking-tight"
                style={{ color: PALETTE.text }}
              >
                {headerTitle}
              </span>
            </div>

            {/* Decorative ruled lines */}
            <div className="absolute inset-x-0" style={{ top: 36, bottom: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`line-${i}`}
                  className="absolute"
                  style={{
                    left: 0,
                    right: 0,
                    top: i * 40 + 32,
                    height: 1,
                    background: PALETTE.pageLine,
                  }}
                />
              ))}
            </div>

            {/* Food entries */}
            <div className="relative z-10 flex flex-col gap-3 pt-2">
              {ENTRIES.map((e, i) => (
                <motion.div
                  key={e.emoji}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.4 + i * 0.1,
                    duration: 0.35,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[16px]"
                    style={{
                      backgroundColor: PALETTE.accent,
                      border: `1px solid ${PALETTE.border}`,
                    }}
                    aria-hidden
                  >
                    {e.emoji}
                  </span>
                  <span
                    className="truncate text-[13px] font-semibold tracking-tight"
                    style={{ color: PALETTE.text }}
                  >
                    {e.label[lng]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function WeeklyPlanPreviewStep({
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
      title:
        "Erreiche dein Ziel durch einen Wochenplan gezielt auf dein Kalorienziel.",
      subtitle: "Kein Kalorientracken mehr! – Wir machen es für dich.",
      bookHeader: "Mein Plan",
      next: "Weiter",
      back: "Zurück",
    },
    en: {
      title:
        "Hit your goal with a weekly plan dialled in to your calorie target.",
      subtitle: "No more calorie tracking — we do it for you.",
      bookHeader: "My plan",
      next: "Next",
      back: "Back",
    },
    fr: {
      title:
        "Atteins ton objectif grâce à un plan hebdomadaire calé sur ton apport calorique.",
      subtitle: "Plus besoin de compter — on s'en charge pour toi.",
      bookHeader: "Mon plan",
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
          className="text-[22px] font-semibold leading-snug tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {t.title}
        </h1>
        <p
          className="mt-2.5 text-[14px] leading-relaxed"
          style={{ color: PALETTE.textMuted }}
        >
          {t.subtitle}
        </p>
      </motion.div>

      {/* Hero: notebook with food */}
      <div className="flex flex-1 min-h-0 items-center justify-center px-5">
        <MealNotebook headerTitle={t.bookHeader} lng={lng} />
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
