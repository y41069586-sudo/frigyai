import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";

type GenderId = "male" | "female" | "non-binary";

type GenderSelectStepProps = {
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
  cardBorderIdle: "#EEF2EF",
};

export function GenderSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: GenderSelectStepProps) {
  const { language, t } = useLanguage();

  const options: { id: GenderId; emoji: string; label: string }[] = [
    {
      id: "male",
      emoji: "👨",
      label: language === "de" ? "Männlich" : language === "fr" ? "Homme" : "Male",
    },
    {
      id: "female",
      emoji: "👩",
      label: language === "de" ? "Weiblich" : language === "fr" ? "Femme" : "Female",
    },
    {
      id: "non-binary",
      emoji: "✨",
      label:
        language === "de" ? "Nicht-binär" : language === "fr" ? "Non-binaire" : "Non-binary",
    },
  ];

  const title =
    language === "de"
      ? "Was ist dein Geschlecht?"
      : language === "fr"
        ? "Quel est ton genre ?"
        : "What is your gender?";

  const subtitle =
    language === "de"
      ? "Das hilft uns deinen Plan zu personalisieren."
      : language === "fr"
        ? "Cela nous aide à personnaliser ton plan."
        : "This helps us personalize your plan.";

  const canProceed = userData.gender !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* ── Top bar: back + progress dots ── */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2 shrink-0">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-neutral-500 transition-colors hover:bg-white"
            style={{ boxShadow: "0 1px 2px rgba(15,40,30,0.04)" }}
          >
            <ChevronLeft className="size-5" />
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

      {/* ── Title + subtitle ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-10 pb-8 shrink-0"
      >
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ color: PALETTE.textMuted }}
        >
          {subtitle}
        </p>
      </motion.div>

      {/* ── Option cards ── */}
      <div className="flex flex-1 min-h-0 flex-col gap-3 px-5 overflow-y-auto">
        {options.map((opt, i) => {
          const selected = userData.gender === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: selected ? 1.02 : 1,
              }}
              transition={{
                opacity: { delay: 0.08 + i * 0.06, duration: 0.35 },
                y: { delay: 0.08 + i * 0.06, duration: 0.35 },
                scale: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{ scale: selected ? 1.0 : 0.985 }}
              onClick={() => setUserData({ ...userData, gender: opt.id })}
              className="group relative flex h-[72px] w-full items-center gap-4 rounded-[20px] px-5 text-left transition-all duration-200"
              style={{
                backgroundColor: selected ? PALETTE.selectedBg : "#FFFFFF",
                border: `1.5px solid ${selected ? PALETTE.border : PALETTE.cardBorderIdle}`,
                boxShadow: selected
                  ? "0 8px 24px -10px rgba(123,224,184,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                  : "0 1px 2px rgba(15,40,30,0.03)",
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl transition-colors"
                style={{
                  backgroundColor: selected ? "#D6F8E8" : "#F2FAF6",
                }}
                aria-hidden
              >
                <span>{opt.emoji}</span>
              </div>
              <span
                className="flex-1 text-[16px] font-medium tracking-tight"
                style={{ color: PALETTE.text }}
              >
                {opt.label}
              </span>
              <motion.span
                initial={false}
                animate={{
                  scale: selected ? 1 : 0.6,
                  opacity: selected ? 1 : 0,
                }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="flex h-7 w-7 items-center justify-center rounded-full"
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

      {/* ── Continue button ── */}
      <div className="shrink-0 px-5 pt-6 pb-10">
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={onNext}
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
