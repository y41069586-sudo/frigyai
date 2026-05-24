import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, Heart, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import frigyMascot from "@/assets/frigy-mascot.png";

const PALETTE = {
  primary: "#7BE0B8",
  primaryDark: "#5BCB9F",
  bg: "#F7FFFB",
  secondary: "#E8FFF4",
  border: "#B7F0D7",
  text: "#1F2937",
  textMuted: "#6B7280",
  syncIcon: "#9CA3AF",
};

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext: () => void;
  currentIndex?: number;
  totalSteps?: number;
};

const haptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(18);
  }
};

export function AppleHealthConnectStep({
  userData: _userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language } = useLanguage();
  const [phase, setPhase] = useState<"idle" | "connecting" | "success">("idle");

  const copy = {
    de: {
      title: "MIT APPLE HEALTH VERBINDEN",
      subtitle:
        "Bitte erlaube uns, deine Apple-Health-Daten zu synchronisieren, um eine genaue Kalorienberechnung und Analyse zu erhalten.",
      notNow: "Nicht jetzt",
      activate: "Aktivieren",
    },
    en: {
      title: "CONNECT APPLE HEALTH",
      subtitle:
        "Allow us to sync your Apple Health data for accurate calorie tracking and insights.",
      notNow: "Not now",
      activate: "Connect",
    },
    fr: {
      title: "CONNECTER APPLE SANTÉ",
      subtitle:
        "Autorise la synchronisation avec Apple Santé pour un suivi calorique et des analyses précises.",
      notNow: "Pas maintenant",
      activate: "Activer",
    },
  } as const;

  const lng = language === "fr" ? "fr" : language === "en" ? "en" : "de";
  const t = copy[lng];

  const handleNotNow = () => {
    setUserData((prev) => ({ ...prev, healthSync: null }));
    onNext();
  };

  const handleActivate = async () => {
    if (phase !== "idle") return;
    haptic();
    setPhase("connecting");
    await new Promise((r) => setTimeout(r, 1400));
    setPhase("success");
    setUserData((prev) => ({ ...prev, healthSync: "apple" }));
    await new Promise((r) => setTimeout(r, 450));
    onNext();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        backgroundColor: PALETTE.bg,
        color: PALETTE.text,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Progress */}
      <div className="flex shrink-0 items-center gap-3 px-5 pt-3 pb-2">
        {onBack ? (
          <div className="h-9 w-9 shrink-0" aria-hidden />
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

      {/* Top visual — app + sync + Apple Health */}
      <div
        className="relative mx-5 mt-2 shrink-0 overflow-hidden rounded-[28px] px-6 py-10"
        style={{
          background: "linear-gradient(165deg, #E8FFF4 0%, #F0FFF8 42%, #F7FFFB 100%)",
          boxShadow: "0 20px 48px -28px rgba(60,120,90,0.22), 0 2px 8px -4px rgba(60,120,90,0.06)",
        }}
      >
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <div
            className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-white/95"
            style={{
              boxShadow: "0 8px 24px -12px rgba(15,40,30,0.12), 0 1px 3px rgba(15,40,30,0.04)",
            }}
          >
            <img src={frigyMascot} alt="" className="h-[58px] w-[58px] object-contain" draggable={false} />
          </div>

          <div className="relative flex h-16 w-14 shrink-0 items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === "success" ? (
                <motion.div
                  key="ok"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
                    boxShadow: "0 8px 20px -6px rgba(91,203,159,0.55)",
                  }}
                >
                  <Check className="size-6 text-white" strokeWidth={2.8} />
                </motion.div>
              ) : (
                <motion.div
                  key="sync"
                  className="flex items-center justify-center"
                  animate={
                    phase === "connecting"
                      ? { scale: [1, 1.12, 1], opacity: [1, 0.85, 1] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={
                    phase === "connecting"
                      ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.25 }
                  }
                >
                  <RefreshCw
                    className="size-9"
                    style={{ color: PALETTE.syncIcon }}
                    strokeWidth={2.2}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-white/95"
            style={{
              boxShadow: "0 8px 24px -12px rgba(15,40,30,0.12), 0 1px 3px rgba(15,40,30,0.04)",
            }}
          >
            <Heart className="size-11 fill-[#FF2D55] text-[#FF2D55]" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Copy — lower half emphasis */}
      <motion.div
        initial={false}
        className="flex flex-1 flex-col px-6 pt-8"
      >
        <h1
          className="text-left text-[22px] font-bold uppercase leading-snug tracking-tight sm:text-[24px]"
          style={{ color: PALETTE.text, letterSpacing: "0.02em" }}
        >
          {t.title}
        </h1>
        <p
          className="mt-4 max-w-prose text-left text-[15px] leading-relaxed sm:text-[16px]"
          style={{ color: PALETTE.textMuted }}
        >
          {t.subtitle}
        </p>
      </motion.div>

      {/* Bottom bar */}
      <div className="flex shrink-0 items-stretch gap-3 px-5 pb-6 pt-4">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            disabled={phase !== "idle"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: "#EAF8F1",
              color: PALETTE.primaryDark,
              boxShadow: "0 1px 3px rgba(15,40,30,0.06)",
            }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </motion.button>
        ) : (
          <div className="h-12 w-12 shrink-0" />
        )}

        <div
          className="flex min-h-[52px] flex-1 overflow-hidden rounded-[18px]"
          style={{
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 6px 20px -12px rgba(60,120,90,0.15)",
          }}
        >
          <motion.button
            type="button"
            whileTap={phase === "idle" ? { scale: 0.98 } : {}}
            onClick={handleNotNow}
            disabled={phase !== "idle"}
            className="flex flex-1 items-center justify-center px-2 text-[14px] font-semibold transition-opacity sm:text-[15px] disabled:opacity-45"
            style={{
              backgroundColor: PALETTE.secondary,
              color: PALETTE.text,
            }}
          >
            {t.notNow}
          </motion.button>
          <motion.button
            type="button"
            whileTap={phase === "idle" ? { scale: 0.98 } : {}}
            onClick={handleActivate}
            disabled={phase !== "idle"}
            className="flex flex-1 items-center justify-center px-2 text-[14px] font-semibold text-white transition-opacity sm:text-[15px] disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            }}
          >
            {t.activate}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
