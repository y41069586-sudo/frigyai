import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
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
  primary: "#6EF0A8",
  primaryDark: "#4AE896",
  bg: "#FEFFFE",
  selectedBg: "#E0FDEC",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const KG_PER_LB = 0.45359237;

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

export function TargetWeightSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language } = useLanguage();

  const unit = userData.weightUnit;
  const isMetric = unit === "metric";

  // Smart-init: on first mount, if target is still the schema default and the
  // user already set their current weight, derive a sensible target.
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (userData.targetWeight === 65 && userData.targetWeightDecimal === 0) {
      let adjusted = userData.weight;
      if (userData.goalMode === "lose") adjusted = Math.max(40, userData.weight - 5);
      else if (userData.goalMode === "gain") adjusted = userData.weight + 5;
      setUserData((prev) => ({
        ...prev,
        targetWeight: adjusted,
        targetWeightDecimal: prev.weightDecimal ?? 0,
      }));
    }
  }, []);

  const totalKg =
    userData.targetWeight + (userData.targetWeightDecimal ?? 0) / 10;
  const totalLbs = totalKg / KG_PER_LB;

  const displayValue = isMetric ? totalKg : totalLbs;
  const whole = Math.floor(displayValue);
  const decimal = Math.max(0, Math.min(9, Math.round((displayValue - whole) * 10)));

  const minWhole = isMetric ? 30 : 66;
  const maxWhole = isMetric ? 250 : 550;

  const wholeOptions: MintWheelOption[] = Array.from(
    { length: maxWhole - minWhole + 1 },
    (_, i) => {
      const v = minWhole + i;
      return { value: v, label: String(v) };
    },
  );
  const decimalOptions: MintWheelOption[] = Array.from({ length: 10 }, (_, i) => ({
    value: i,
    label: String(i),
  }));

  const commitDisplay = (newWhole: number, newDecimal: number) => {
    const display = newWhole + newDecimal / 10;
    const kg = isMetric ? display : display * KG_PER_LB;
    const kgWhole = Math.floor(kg);
    const kgDecimal = Math.max(0, Math.min(9, Math.round((kg - kgWhole) * 10)));
    setUserData({
      ...userData,
      targetWeight: kgWhole,
      targetWeightDecimal: kgDecimal,
    });
  };

  const handleUnitChange = (nextUnit: "metric" | "imperial") => {
    if (nextUnit === unit) return;
    setUserData({ ...userData, weightUnit: nextUnit });
  };

  const titles = {
    de: {
      lose: "Was ist dein Zielgewicht?",
      gain: "Was ist dein Wunschgewicht?",
      maintain: "Bestätige dein Zielgewicht",
      fallback: "Was ist dein Zielgewicht?",
    },
    en: {
      lose: "What's your target weight?",
      gain: "What's your desired weight?",
      maintain: "Confirm your target weight",
      fallback: "What's your target weight?",
    },
    fr: {
      lose: "Quel est ton poids cible ?",
      gain: "Quel est ton poids souhaité ?",
      maintain: "Confirme ton poids cible",
      fallback: "Quel est ton poids cible ?",
    },
  } as const;
  const buttonLabel = {
    de: "Ziel festlegen",
    en: "Set goal",
    fr: "Définir l'objectif",
  } as const;

  const lng = (language as "de" | "en" | "fr") in titles ? (language as "de" | "en" | "fr") : "de";
  const goal = userData.goalMode;
  const title =
    goal === "lose"
      ? titles[lng].lose
      : goal === "gain"
        ? titles[lng].gain
        : goal === "maintain"
          ? titles[lng].maintain
          : titles[lng].fallback;

  const sepChar = isMetric ? "," : ".";
  const unitLabel = isMetric ? "kg" : "lbs";

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
              backgroundColor: "#F5FFF9",
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
          className="relative mx-auto w-full max-w-[260px] shrink-0 py-0.5"
        >
          <div
            className="pointer-events-none absolute inset-x-0 z-0 rounded-xl"
            style={{
              top: `calc(50% - ${WHEEL_ITEM_HEIGHT / 2}px)`,
              height: WHEEL_ITEM_HEIGHT,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 3px rgba(110, 240, 168,0.16)",
            }}
          />
{/* Wheels */}
          <div className="relative z-10 flex items-stretch justify-center">
            <MintWheelColumn
              options={wholeOptions}
              value={whole}
              onChange={(v) => commitDisplay(v, decimal)}
              align="right"
              width={100}
              ariaLabel={`Zielgewicht ganz (${unitLabel})`}
            />
            <div className="relative shrink-0" style={{ width: 22 }}>
              <span
                className="absolute inset-0 flex items-center justify-center text-[19px] font-semibold"
                style={{ color: PALETTE.text }}
              >
                {sepChar}
              </span>
            </div>
            <MintWheelColumn
              options={decimalOptions}
              value={decimal}
              onChange={(v) => commitDisplay(whole, v)}
              align="left"
              width={56}
              ariaLabel="Dezimal"
            />
            <div className="relative shrink-0" style={{ width: 44 }}>
              <span
                className="absolute inset-0 flex items-center pl-1.5 text-[16px] font-medium"
                style={{ color: PALETTE.textMuted }}
              >
                {unitLabel}
              </span>
            </div>
          </div>
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
              "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {buttonLabel[lng]}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
