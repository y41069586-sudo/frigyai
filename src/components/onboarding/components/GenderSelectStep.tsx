import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MINT_STEP_HEADER_PT } from "../layout";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";

type GenderSelectStepProps = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#1ED78A",
  primaryDark: "#18A872",
  bg: "#EDFAF4",
  selectedBg: "#C8F5E0",
  border: "#6EECC0",
  text: "#1F2937",
  cardBorderIdle: "#D1D5DB",
};

const GENDER_IMAGES = {
  male: "/gender-male.png",
  female: "/gender-female.png",
} as const;

export function GenderSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: GenderSelectStepProps) {
  const { language, t } = useLanguage();

  const binaryOptions: {
    id: "male" | "female";
    image: string;
    label: string;
  }[] = [
    {
      id: "male",
      image: GENDER_IMAGES.male,
      label: language === "de" ? "Männlich" : language === "fr" ? "Homme" : "Male",
    },
    {
      id: "female",
      image: GENDER_IMAGES.female,
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
    <motion.div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* ── Top bar: back ── */}
      <div
        className="flex shrink-0 items-center px-5 pb-1"
        style={{ paddingTop: MINT_STEP_HEADER_PT }}
      >
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
          <div className="h-9 w-9 shrink-0" aria-hidden />
        )}
      </div>

      <OnboardingMascotQuestion>
        <h1
          className="text-[19px] font-semibold leading-snug tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
      </OnboardingMascotQuestion>

      {/* ── Männlich / Weiblich + Nicht-binär ── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 pb-4 pt-6">
        <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-4">
          {binaryOptions.map((opt, i) => {
            const selected = userData.gender === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  opacity: { delay: 0.08 + i * 0.06, duration: 0.35 },
                  y: { delay: 0.08 + i * 0.06, duration: 0.35 },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setUserData({ ...userData, gender: opt.id })}
                aria-pressed={selected}
                className="flex flex-col items-center gap-2.5 border-0 bg-transparent p-0"
              >
                <div className="relative w-full" style={{ aspectRatio: "1" }}>
                  <img
                    src={opt.image}
                    alt=""
                    className="h-full w-full object-contain transition-[box-shadow] duration-200"
                    style={
                      selected
                        ? {
                            boxShadow: `0 0 0 3px ${PALETTE.selectedBg}, 0 0 0 5px ${PALETTE.border}`,
                          }
                        : undefined
                    }
                    draggable={false}
                  />
                </div>
                <span
                  className="text-[15px] font-medium tracking-tight"
                  style={{ color: PALETTE.text }}
                >
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { delay: 0.22, duration: 0.35 }, y: { delay: 0.22, duration: 0.35 } }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              setUserData({
                ...userData,
                gender: userData.gender === "non-binary" ? null : "non-binary",
              })
            }
            aria-pressed={userData.gender === "non-binary"}
            className="flex items-center gap-3"
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors duration-200"
              style={{
                borderColor:
                  userData.gender === "non-binary" ? PALETTE.border : PALETTE.cardBorderIdle,
                backgroundColor:
                  userData.gender === "non-binary" ? PALETTE.primary : "#FFFFFF",
              }}
              aria-hidden
            >
              {userData.gender === "non-binary" ? (
                <Check className="size-3.5 text-white" strokeWidth={3} />
              ) : null}
            </span>
            <span
              className="text-[15px] font-medium tracking-tight"
              style={{ color: PALETTE.text }}
            >
              {nonBinaryLabel}
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Continue */}
      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <OnboardingDataNotice variant="mint" className="mb-3" />
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
              ? "0 10px 24px -8px rgba(24,168,114,0.55), 0 2px 4px rgba(15,40,30,0.05)"
              : "0 1px 2px rgba(15,40,30,0.04)",
            cursor: canProceed ? "pointer" : "not-allowed",
            opacity: canProceed ? 1 : 0.85,
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
}


