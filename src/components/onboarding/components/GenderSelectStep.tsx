import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";

type GenderSelectStepProps = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#24FF8F",
  primaryDark: "#12D978",
  bg: "#F0FFF7",
  selectedBg: "#D4FFEA",
  border: "#6EECC0",
  text: "#1F2937",
  cardBorderIdle: "#D1D5DB",
};

export function GenderSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: GenderSelectStepProps) {
  const { language, t } = useLanguage();

  const binaryOptions: { id: "male" | "female"; emoji: string; label: string }[] = [
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
  ];

  const nonBinaryLabel =
    language === "de" ? "Nicht-binär" : language === "fr" ? "Non-binaire" : "Non-binary";

  const title =
    language === "de"
      ? "Was ist dein Geschlecht?"
      : language === "fr"
        ? "Quel est ton genre ?"
        : "What is your gender?";

  const canProceed = userData.gender !== null;

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* ── Top bar: back ── */}
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+0.25rem)]">
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
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="min-w-0 shrink-0 px-6 pb-3 pt-1"
      >
        <h1
          className="text-[22px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
      </motion.div>

      {/* ── Männlich / Weiblich zentriert, Nicht-binär als eigene Zeile mit Kästchen ── */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-1 mt-6">
        <div className="mx-auto grid w-full max-w-[320px] grid-cols-2 gap-3">
          {binaryOptions.map((opt, i) => {
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
                className="group relative flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[20px] px-3 py-3 text-center transition-all duration-200"
                style={{
                  backgroundColor: selected ? PALETTE.selectedBg : "#FFFFFF",
                  border: `1.5px solid ${selected ? PALETTE.border : PALETTE.cardBorderIdle}`,
                  boxShadow: selected
                    ? "0 8px 24px -10px rgba(36,255,143,0.55), 0 2px 6px rgba(15,40,30,0.04)"
                    : "0 1px 2px rgba(15,40,30,0.03)",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors"
                  style={{
                    backgroundColor: selected ? "#C0FFD9" : "#EAFFF5",
                  }}
                  aria-hidden
                >
                  <span>{opt.emoji}</span>
                </div>
                <span
                  className="text-[15px] font-medium tracking-tight"
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
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: PALETTE.primary,
                    boxShadow: "0 4px 10px -3px rgba(36,255,143,0.6)",
                  }}
                  aria-hidden
                >
                  <Check className="size-3.5 text-white" strokeWidth={3} />
                </motion.span>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { delay: 0.22, duration: 0.35 }, y: { delay: 0.22, duration: 0.35 } }}
          whileTap={{ scale: userData.gender === "non-binary" ? 1 : 0.99 }}
          onClick={() => setUserData({ ...userData, gender: "non-binary" })}
          aria-pressed={userData.gender === "non-binary"}
          className="mx-auto flex w-full max-w-[320px] items-center justify-between gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all duration-200"
          style={{
            backgroundColor: userData.gender === "non-binary" ? PALETTE.selectedBg : "#FFFFFF",
            borderColor:
              userData.gender === "non-binary" ? PALETTE.border : PALETTE.cardBorderIdle,
            borderWidth: 1.5,
            boxShadow:
              userData.gender === "non-binary"
                ? "0 8px 24px -10px rgba(36,255,143,0.45), 0 2px 6px rgba(15,40,30,0.04)"
                : "0 1px 2px rgba(15,40,30,0.03)",
          }}
        >
          <p className="min-w-0 flex-1 text-[15px] font-medium tracking-tight" style={{ color: PALETTE.text }}>
            {nonBinaryLabel}
          </p>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors"
            style={{
              borderColor: userData.gender === "non-binary" ? PALETTE.border : PALETTE.cardBorderIdle,
              backgroundColor: userData.gender === "non-binary" ? "#D4FFEA" : "#FFFFFF",
            }}
            aria-hidden
          >
            {userData.gender === "non-binary" ? (
              <Check className="size-5 text-neutral-900" strokeWidth={2.8} />
            ) : null}
          </div>
        </motion.button>
      </div>

      {/* Continue */}
      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={onNext}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #BEF5D8 0%, #98EBC5 100%)",
            boxShadow: canProceed
              ? "0 10px 24px -8px rgba(18,217,120,0.55), 0 2px 4px rgba(15,40,30,0.05)"
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
