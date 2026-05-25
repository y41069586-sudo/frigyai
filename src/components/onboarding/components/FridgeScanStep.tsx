import { motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
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
  fridgeBody: "#FBFEFC",
  fridgeBorder: "#D8E8E0",
  shelfLine: "#E2EFE7",
  innerBg: "#F4FBF7",
};

type Lng = "de" | "en" | "fr";

function CameraIcon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative flex items-center justify-center"
      style={{ width: 200, height: 200 }}
    >
      {/* Soft floor glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          bottom: -8,
          transform: "translateX(-50%)",
          width: 180,
          height: 22,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(74, 232, 150,0.25) 0%, rgba(74, 232, 150,0) 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Soft pulsing halo */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(110, 240, 168,0.25) 0%, rgba(110, 240, 168,0) 65%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Camera icon container */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex items-center justify-center rounded-[40px]"
        style={{
          width: 140,
          height: 140,
          background:
            "linear-gradient(135deg, #F2FFF8 0%, #75FBB2 100%)",
          color: "#fff",
          boxShadow:
            "0 24px 50px -16px rgba(74, 232, 150,0.55), 0 6px 14px -4px rgba(74, 232, 150,0.30), inset 0 1px 2px rgba(255,255,255,0.6)",
        }}
      >
        <Camera className="size-[78px]" strokeWidth={1.6} />
      </motion.div>
    </motion.div>
  );
}

export function FridgeScanStep({
  onBack,
  onNext,
}: Props) {
  const { language } = useLanguage();
  const lng: Lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as Lng)
    : "de";

  const L = {
    de: {
      titleBefore: "Scanne deinen ",
      titleHighlight: "Kühlschrank",
      subtitle:
        "Entdecke sofort, welche Zutaten du bereits hast und was dir für deinen Plan noch fehlt.",
      cta: "Weiter",
      back: "Zurück",
    },
    en: {
      titleBefore: "Scan your ",
      titleHighlight: "fridge",
      subtitle:
        "Instantly see which ingredients you already have and what's missing for your plan.",
      cta: "Next",
      back: "Back",
    },
    fr: {
      titleBefore: "Scanne ton ",
      titleHighlight: "frigo",
      subtitle:
        "Découvre tout de suite ce que tu as déjà et ce qu'il te manque pour ton plan.",
      cta: "Suivant",
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
        </h1>
      </OnboardingMascotQuestion>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        className="mt-1 px-5 text-[15px] leading-relaxed"
        style={{ color: PALETTE.subtext }}
      >
        {t.subtitle}
      </motion.p>

      {/* Hero: camera icon */}
      <div className="mt-4 flex flex-1 min-h-0 items-center justify-center px-5 pb-2">
        <CameraIcon />
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
          {t.cta}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
