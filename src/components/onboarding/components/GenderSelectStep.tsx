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
  primary: "#6EF0A8",
  primaryDark: "#4AE896",
  bg: "#FEFFFE",
  selectedBg: "#E0FDEC",
  border: "#6EF0A8",
  text: "#1F2937",
  cardBorderIdle: "#DDEECD",
};

const GENDER_IMAGES = {
  male: "/gender-male.png",
  female: "/gender-female.png",
} as const;

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };
const EASE = [0.22, 1, 0.36, 1] as const;

const SELECTED_RING =
  "0 0 0 3px #E0FDEC, 0 0 0 5px #6EF0A8";

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
    { id: "male", image: GENDER_IMAGES.male, label: t.onboardingMale },
    { id: "female", image: GENDER_IMAGES.female, label: t.onboardingFemale },
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

  const selectGender = (gender: "male" | "female") => {
    setUserData((prev) => ({ ...prev, gender }));
  };

  const toggleNonBinary = () => {
    setUserData((prev) => ({
      ...prev,
      gender: prev.gender === "non-binary" ? null : "non-binary",
    }));
  };

  return (
    <motion.div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      <div
        className="flex shrink-0 items-center px-5 pb-1"
        style={{ paddingTop: MINT_STEP_HEADER_PT }}
      >
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label={t.back}
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 pb-4 pt-6">
        <motion.div
          className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {binaryOptions.map((opt) => {
            const selected = userData.gender === opt.id;

            return (
              <motion.button
                key={opt.id}
                type="button"
                layout
                onClick={() => selectGender(opt.id)}
                aria-pressed={selected}
                animate={{
                  scale: selected ? 1.03 : 1,
                  opacity: selected ? 1 : 0.88,
                }}
                transition={SPRING}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-2.5 border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#6EF0A8]/50"
              >
                <motion.div
                  className="relative w-full"
                  style={{ aspectRatio: "1" }}
                  animate={{
                    boxShadow: selected ? SELECTED_RING : "0 0 0 3px transparent, 0 0 0 5px transparent",
                  }}
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  <img
                    src={opt.image}
                    alt=""
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </motion.div>
                <motion.span
                  className="text-[15px] font-medium tracking-tight"
                  style={{ color: PALETTE.text }}
                  animate={{
                    fontWeight: selected ? 600 : 500,
                    opacity: selected ? 1 : 0.72,
                  }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  {opt.label}
                </motion.span>
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: EASE }}
        >
          <motion.button
            type="button"
            layout
            onClick={toggleNonBinary}
            aria-pressed={userData.gender === "non-binary"}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 border-0 bg-transparent p-0 outline-none"
          >
            <motion.span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2"
              animate={{
                borderColor:
                  userData.gender === "non-binary" ? PALETTE.border : PALETTE.cardBorderIdle,
                backgroundColor:
                  userData.gender === "non-binary" ? PALETTE.primary : "#FFFFFF",
                scale: userData.gender === "non-binary" ? 1.05 : 1,
              }}
              transition={SPRING}
              aria-hidden
            >
              <motion.span
                initial={false}
                animate={{
                  opacity: userData.gender === "non-binary" ? 1 : 0,
                  scale: userData.gender === "non-binary" ? 1 : 0.6,
                }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <Check className="size-3.5 text-white" strokeWidth={3} />
              </motion.span>
            </motion.span>
            <motion.span
              className="text-[15px] font-medium tracking-tight"
              style={{ color: PALETTE.text }}
              animate={{
                opacity: userData.gender === "non-binary" ? 1 : 0.8,
              }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {nonBinaryLabel}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>

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
              : "linear-gradient(135deg, #F5FFF9 0%, #E0FDEC 100%)",
            boxShadow: canProceed
              ? "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)"
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
