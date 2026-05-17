import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import {
  MintWheelColumn,
  WHEEL_ITEM_HEIGHT,
  type MintWheelOption,
} from "./MintWheelColumn";
import { MintSegmentedControl } from "./MintSegmentedControl";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";

const PALETTE = {
  primary: "#24F59B",
  primaryDark: "#10C878",
  bg: "#F2FFF8",
  selectedBg: "#D6FFE9",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

export function HeightSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();

  const unit = userData.heightUnit;
  const isMetric = unit === "metric";

  const heightCm = userData.height;

  const cmOptions: MintWheelOption[] = Array.from({ length: 250 - 100 + 1 }, (_, i) => ({
    value: 100 + i,
    label: String(100 + i),
  }));
  const feetOptions: MintWheelOption[] = Array.from({ length: 8 - 3 + 1 }, (_, i) => ({
    value: 3 + i,
    label: String(3 + i),
  }));
  const inchOptions: MintWheelOption[] = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: String(i),
  }));

  const totalInches = heightCm / CM_PER_INCH;
  const feetFromCm = Math.max(3, Math.min(8, Math.floor(totalInches / INCHES_PER_FOOT)));
  const inchesFromCm = Math.max(
    0,
    Math.min(11, Math.round(totalInches - feetFromCm * INCHES_PER_FOOT)),
  );

  const handleCmChange = (cm: number) => {
    setUserData({ ...userData, height: cm });
  };

  const handleFeetChange = (feet: number) => {
    const cm = Math.round(feet * INCHES_PER_FOOT * CM_PER_INCH + inchesFromCm * CM_PER_INCH);
    setUserData({
      ...userData,
      height: cm,
      heightFeet: feet,
      heightInches: inchesFromCm,
    });
  };

  const handleInchesChange = (inches: number) => {
    const cm = Math.round(feetFromCm * INCHES_PER_FOOT * CM_PER_INCH + inches * CM_PER_INCH);
    setUserData({
      ...userData,
      height: cm,
      heightFeet: feetFromCm,
      heightInches: inches,
    });
  };

  const handleUnitChange = (nextUnit: "metric" | "imperial") => {
    if (nextUnit === unit) return;
    setUserData({ ...userData, heightUnit: nextUnit });
  };

  const title =
    language === "de"
      ? "Wie groß bist du?"
      : language === "fr"
        ? "Quelle est ta taille ?"
        : "How tall are you?";

  const unitOptions: { id: "metric" | "imperial"; label: string }[] = [
    {
      id: "metric",
      label: language === "fr" ? "Métrique" : language === "en" ? "Metric" : "Metrisch",
    },
    { id: "imperial", label: "Imperial" },
  ];

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
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#E6FFF2",
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
          {title}
        </h1>
      </OnboardingMascotQuestion>

      {/* Unit toggle */}
      <div className="mt-4 flex shrink-0 justify-center px-5 pb-2">
        <MintSegmentedControl
          options={unitOptions}
          value={unit}
          onChange={handleUnitChange}
          ariaLabel="Einheit"
        />
      </div>

      {/* Wheel — direkt auf Mint-Hintergrund */}
      <div className="mt-2 flex shrink-0 flex-col overflow-x-hidden px-4 pb-1">
        <motion.div
          key={unit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
          className="relative mx-auto w-full max-w-[320px] shrink-0 py-0.5"
        >
          <div
            className="pointer-events-none absolute inset-x-0 z-0 rounded-xl"
            style={{
              top: `calc(50% - ${WHEEL_ITEM_HEIGHT / 2}px)`,
              height: WHEEL_ITEM_HEIGHT,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 3px rgba(30,215,138,0.16)",
            }}
          />
{/* Content depends on unit */}
          {isMetric ? (
            <div className="relative z-10 flex items-stretch justify-center">
              <MintWheelColumn
                options={cmOptions}
                value={heightCm}
                onChange={handleCmChange}
                align="center"
                width={120}
                ariaLabel="cm"
              />
              <div className="relative flex w-11 shrink-0 items-center justify-center pl-0.5">
                <span
                  className="text-[16px] font-medium"
                  style={{ color: PALETTE.textMuted }}
                >
                  cm
                </span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex items-stretch justify-center">
              <MintWheelColumn
                options={feetOptions}
                value={feetFromCm}
                onChange={handleFeetChange}
                align="right"
                width={62}
                ariaLabel="Fuß"
              />
              <div className="relative shrink-0" style={{ width: 36 }}>
                <span
                  className="absolute inset-0 flex items-center pl-1.5 text-[16px] font-medium"
                  style={{ color: PALETTE.textMuted }}
                >
                  ft
                </span>
              </div>
              <MintWheelColumn
                options={inchOptions}
                value={inchesFromCm}
                onChange={handleInchesChange}
                align="right"
                width={52}
                ariaLabel="Zoll"
              />
              <div className="relative shrink-0" style={{ width: 36 }}>
                <span
                  className="absolute inset-0 flex items-center pl-1.5 text-[16px] font-medium"
                  style={{ color: PALETTE.textMuted }}
                >
                  in
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

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
              "0 10px 24px -8px rgba(24,168,114,0.55), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
