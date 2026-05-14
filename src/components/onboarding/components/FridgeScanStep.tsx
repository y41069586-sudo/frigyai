import { motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
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
            "radial-gradient(ellipse, rgba(91,203,159,0.25) 0%, rgba(91,203,159,0) 70%)",
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
            "radial-gradient(circle, rgba(123,224,184,0.25) 0%, rgba(123,224,184,0) 65%)",
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
            "linear-gradient(135deg, #BCF1DA 0%, #7BE0B8 100%)",
          color: "#fff",
          boxShadow:
            "0 24px 50px -16px rgba(91,203,159,0.55), 0 6px 14px -4px rgba(91,203,159,0.30), inset 0 1px 2px rgba(255,255,255,0.6)",
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
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language } = useLanguage();
  const lng: Lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as Lng)
    : "de";

  const L = {
    de: {
      title: "Scanne deinen Kühlschrank",
      subtitle:
        "Entdecke sofort, welche Zutaten du bereits hast und was dir für deinen Plan noch fehlt.",
      cta: "Weiter",
      back: "Zurück",
    },
    en: {
      title: "Scan your fridge",
      subtitle:
        "Instantly see which ingredients you already have and what's missing for your plan.",
      cta: "Next",
      back: "Back",
    },
    fr: {
      title: "Scanne ton frigo",
      subtitle:
        "Découvre tout de suite ce que tu as déjà et ce qu'il te manque pour ton plan.",
      cta: "Suivant",
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

      {/* Hero: camera icon */}
      <div className="flex flex-1 min-h-0 items-center justify-center px-5">
        <CameraIcon />
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
          {t.cta}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
