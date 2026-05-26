import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
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
  bg: "#FBFFFD",
  accent: "#DCFEEF",
  border: "#BCFDDC",
  text: "#1F2937",
  subtext: "#7C9388",
  cardBorderIdle: "#D1D5DB",
  pageLine: "#EDF7F1",
};

type Lng = "de" | "en" | "fr";

const ITEMS: { emoji: string; label: Record<Lng, string> }[] = [
  { emoji: "🥛", label: { de: "Bio-Hafermilch", en: "Organic oat milk", fr: "Lait d'avoine bio" } },
  { emoji: "🥑", label: { de: "Avocados", en: "Avocados", fr: "Avocats" } },
  { emoji: "🐟", label: { de: "Lachsfilet", en: "Salmon fillet", fr: "Filet de saumon" } },
  { emoji: "🥗", label: { de: "Rucola-Salat", en: "Rocket salad", fr: "Salade de roquette" } },
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
      style={{ width: 192, height: 252 }}
    >
      {/* Soft floor glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          bottom: 4,
          transform: "translateX(-50%)",
          width: 148,
          height: 18,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(57, 212, 127,0.22) 0%, rgba(57, 212, 127,0) 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Clipboard clip */}
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ top: 0 }}
        aria-hidden
      >
        <div
          className="relative"
          style={{
            width: 34,
            height: 14,
            borderRadius: "8px 8px 5px 5px",
            background:
              "linear-gradient(180deg, #FBFFFD 0%, #75FBB2 42%, #39D47F 100%)",
            boxShadow:
              "0 5px 14px -3px rgba(24,104,72,0.45), inset 0 2px 0 rgba(255,255,255,0.65), inset 0 -3px 5px rgba(10,90,55,0.28)",
          }}
        >
          <div
            className="absolute inset-x-1 top-[2px] h-[2px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.15) 100%)",
            }}
          />
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              top: 6,
              transform: "translateX(-50%)",
              width: 14,
              height: 4,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)",
              border: "1px solid rgba(255,255,255,0.75)",
              boxShadow: "inset 0 1px 2px rgba(24,104,72,0.15)",
            }}
          />
        </div>
      </motion.div>

      {/* Card body */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute inset-x-0 mx-auto flex flex-col overflow-hidden rounded-[18px]"
        style={{
          top: 9,
          width: 192,
          height: 238,
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFFFC 100%)",
          border: `1px solid ${PALETTE.cardBorderIdle}`,
          boxShadow:
            "0 26px 60px -28px rgba(10,120,75,0.30), 0 6px 16px -8px rgba(10,120,75,0.10)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 pb-2 pt-[14px]">
          <div className="flex items-center gap-1.5">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[4px]"
              style={{
                background:
                  "linear-gradient(135deg, #FBFFFD 0%, #75FBB2 100%)",
                color: "#fff",
                boxShadow:
                  "0 1px 4px -2px rgba(74, 232, 150,0.4), inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              <ClipboardList className="size-2" strokeWidth={2.6} />
            </motion.div>
            <div className="flex min-w-0 flex-col">
              <span
                className="text-[12px] font-semibold tracking-tight"
                style={{ color: PALETTE.text }}
              >
                {headerLabel}
              </span>
              <span
                className="text-[10px]"
                style={{ color: PALETTE.subtext }}
              >
                {countLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-4 shrink-0"
          style={{ height: 1, background: PALETTE.pageLine }}
        />

        {/* Items list — fills to bottom */}
        <div className="flex min-h-0 flex-1 flex-col justify-between px-4 pb-3.5 pt-2">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.label.de}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.55 + i * 0.13,
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex items-center gap-2"
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
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #75FBB2 0%, #39D47F 100%)",
                  boxShadow:
                    "0 3px 8px -2px rgba(74, 232, 150,0.5), inset 0 1px 1px rgba(255,255,255,0.45)",
                }}
              >
                <Check className="size-3 text-white" strokeWidth={3} />
              </motion.div>
              <span
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[12px]"
                style={{
                  background: PALETTE.accent,
                  border: `1px solid ${PALETTE.border}`,
                }}
                aria-hidden
              >
                {item.emoji}
              </span>
              <span
                className="min-w-0 flex-1 truncate text-[11.5px] font-semibold tracking-tight"
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
}: Props) {
  const { language } = useLanguage();
  const lng: Lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as Lng)
    : "de";

  const L = {
    de: {
      titleBefore: "",
      titleHighlight: "Einkaufsliste",
      titleAfter: " generieren",
      subtitle: "Nur die Zutaten, die dir noch fehlen.",
      next: "Weiter",
      back: "Zurück",
    },
    en: {
      titleBefore: "Generate your ",
      titleHighlight: "shopping list",
      titleAfter: "",
      subtitle: "Only the ingredients you're still missing.",
      next: "Next",
      back: "Back",
    },
    fr: {
      titleBefore: "Générer ta ",
      titleHighlight: "liste de courses",
      titleAfter: "",
      subtitle: "Seulement ce qu'il te manque encore.",
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
          {t.titleBefore}
          <MintTextHighlight>{t.titleHighlight}</MintTextHighlight>
          {t.titleAfter}
        </h1>
      </OnboardingMascotQuestion>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        className="mt-1 px-5 text-[14px] leading-snug"
        style={{ color: PALETTE.subtext }}
      >
        {t.subtitle}
      </motion.p>

      {/* Hero: shopping list card */}
      <div className="mt-4 flex flex-1 min-h-0 items-center justify-center px-5 pb-2">
        <ShoppingListCard lng={lng} />
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
