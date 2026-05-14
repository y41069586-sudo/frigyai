import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import {
  MintWheelColumn,
  WHEEL_ITEM_HEIGHT,
  WHEEL_PAD_ITEMS,
  type MintWheelOption,
} from "./MintWheelColumn";
import { MintSegmentedControl } from "./MintSegmentedControl";

const PALETTE = {
  primary: "#7BE0B8",
  primaryDark: "#5BCB9F",
  bg: "#F7FFFB",
  selectedBg: "#E8FFF4",
  text: "#1F2937",
  textMuted: "#6B7280",
  cardBorderIdle: "#EEF2EF",
};

const KG_PER_LB = 0.45359237;

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalSteps?: number;
};

export function WeightSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language, t } = useLanguage();

  const unit = userData.weightUnit;
  const isMetric = unit === "metric";

  const totalKg = userData.weight + (userData.weightDecimal ?? 0) / 10;
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
    setUserData({ ...userData, weight: kgWhole, weightDecimal: kgDecimal });
  };

  const handleUnitChange = (nextUnit: "metric" | "imperial") => {
    if (nextUnit === unit) return;
    setUserData({ ...userData, weightUnit: nextUnit });
  };

  const title =
    language === "de"
      ? "Wie viel wiegst du aktuell?"
      : language === "fr"
        ? "Quel est ton poids actuel ?"
        : "What's your current weight?";

  const subtitle =
    language === "de"
      ? "Das hilft uns deinen Plan zu personalisieren."
      : language === "fr"
        ? "Cela nous aide à personnaliser ton plan."
        : "This helps us personalize your plan.";

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
            aria-label="Zurück"
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
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-8 pb-6 shrink-0"
      >
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: PALETTE.textMuted }}>
          {subtitle}
        </p>
      </motion.div>

      {/* Unit toggle */}
      <div className="flex justify-center px-5 pb-6 shrink-0">
        <MintSegmentedControl
          options={unitOptions}
          value={unit}
          onChange={handleUnitChange}
          ariaLabel="Einheit"
        />
      </div>

      {/* Wheel picker card */}
      <div className="flex flex-1 min-h-0 items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-md rounded-[28px] p-4"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: `1px solid ${PALETTE.cardBorderIdle}`,
            boxShadow:
              "0 24px 50px -24px rgba(60,120,90,0.18), 0 4px 14px -6px rgba(60,120,90,0.08)",
          }}
        >
          {/* Selection band */}
          <div
            className="pointer-events-none absolute inset-x-4 z-0 rounded-2xl"
            style={{
              top: `calc(50% - ${WHEEL_ITEM_HEIGHT / 2}px)`,
              height: WHEEL_ITEM_HEIGHT,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 4px rgba(123,224,184,0.18)",
            }}
          />
          {/* Fades */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 rounded-t-[28px]"
            style={{
              height: WHEEL_PAD_ITEMS * WHEEL_ITEM_HEIGHT + 16,
              background:
                "linear-gradient(180deg, rgba(247,255,251,0.95) 0%, rgba(247,255,251,0.65) 50%, rgba(247,255,251,0) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 rounded-b-[28px]"
            style={{
              height: WHEEL_PAD_ITEMS * WHEEL_ITEM_HEIGHT + 16,
              background:
                "linear-gradient(0deg, rgba(247,255,251,0.95) 0%, rgba(247,255,251,0.65) 50%, rgba(247,255,251,0) 100%)",
            }}
          />

          {/* Two wheels + separator + unit label */}
          <div className="relative z-10 flex items-stretch justify-center">
            <MintWheelColumn
              options={wholeOptions}
              value={whole}
              onChange={(v) => commitDisplay(v, decimal)}
              align="right"
              width={120}
              ariaLabel={`Gewicht ganz (${unitLabel})`}
            />
            <div className="relative shrink-0" style={{ width: 28 }}>
              <span
                className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold"
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
              width={70}
              ariaLabel="Dezimal"
            />
            <div className="relative shrink-0" style={{ width: 60 }}>
              <span
                className="absolute inset-0 flex items-center pl-2 text-[18px] font-medium"
                style={{ color: PALETTE.textMuted }}
              >
                {unitLabel}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Continue */}
      <div className="shrink-0 px-5 pt-6 pb-10">
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
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
