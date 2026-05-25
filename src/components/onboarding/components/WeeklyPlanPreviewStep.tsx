import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import { MintTextHighlight } from "./MintTextHighlight";

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
  bg: "#F2FFF8",
  accent: "#DCFEEF",
  border: "#6EECC0",
  text: "#1F2937",
  subtext: "#7C9388",
  cardBorderIdle: "#D1D5DB",
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
            "radial-gradient(ellipse, rgba(74, 232, 150,0.22) 0%, rgba(74, 232, 150,0) 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Floating food emojis around the book */}
      <motion.span
        className="absolute select-none text-[22px]"
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
        className="absolute select-none text-[20px]"
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
        className="absolute select-none text-[19px]"
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
        className="absolute select-none text-[19px]"
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
            boxShadow: "0 14px 30px -16px rgba(10,120,75,0.20)",
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
              "0 22px 50px -24px rgba(10,120,75,0.30), 0 4px 12px -6px rgba(10,120,75,0.08)",
          }}
        >
          {/* Spiral binding stripe */}
          <div
            className="absolute left-0 top-0 h-full"
            style={{
              width: 22,
              background:
                "linear-gradient(180deg, #F2FFF8 0%, #75FBB2 100%)",
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
                border: "2px solid #39D47F",
                boxShadow: "inset 0 1px 1px rgba(15,40,30,0.1)",
              }}
            />
          ))}

          {/* Page content (everything to the right of the binding) */}
          <div className="absolute" style={{ left: 36, right: 16, top: 18, bottom: 16 }}>
            {/* Title row with sparkle */}
            <div className="flex items-center gap-1.5 pb-2">
              <Sparkles
                className="size-3.5"
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
}: Props) {
  const { language } = useLanguage();
  const lng: Lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as Lng)
    : "de";

  const L = {
    de: {
      titleBefore: "Erreiche dein Ziel durch einen ",
      titleHighlight: "Wochenplan",
      titleAfter: " gezielt auf dein Kalorienziel.",
      bookHeader: "Mein Plan",
      next: "Weiter",
      back: "Zurück",
    },
    en: {
      titleBefore: "Hit your goal with a ",
      titleHighlight: "weekly plan",
      titleAfter: " dialled in to your calorie target.",
      bookHeader: "My plan",
      next: "Next",
      back: "Back",
    },
    fr: {
      titleBefore: "Atteins ton objectif grâce à un ",
      titleHighlight: "plan hebdomadaire",
      titleAfter: " calé sur ton apport calorique.",
      bookHeader: "Mon plan",
      next: "Suivant",
      back: "Retour",
    },
  } as const;
  const t = L[lng];

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
            aria-label={t.back}
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
          {t.titleBefore}
          <MintTextHighlight>{t.titleHighlight}</MintTextHighlight>
          {t.titleAfter}
        </h1>
      </OnboardingMascotQuestion>

      {/* Hero: notebook with food */}
      <div className="mt-4 flex flex-1 min-h-0 items-center justify-center px-5 pb-2">
        <MealNotebook headerTitle={t.bookHeader} lng={lng} />
      </div>

      {/* Continue */}
      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <OnboardingDataNotice variant="mint" className="mb-3" />
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            boxShadow:
              "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
