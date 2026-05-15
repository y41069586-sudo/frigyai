import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import {
  MintWheelColumn,
  useMintWheelRowHeight,
  WHEEL_PAD_ITEMS,
  WHEEL_ROW_COMPACT,
  type MintWheelOption,
} from "./MintWheelColumn";
import { MintSegmentedControl } from "./MintSegmentedControl";

const PALETTE = {
  primary: "#24FF8F",
  primaryDark: "#12D978",
  bg: "#F0FFF7",
  selectedBg: "#D4FFEA",
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

export function WeightSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();
  const wheelRow = useMintWheelRowHeight();
  const wholeColW = wheelRow <= WHEEL_ROW_COMPACT ? 118 : 134;
  const decimalColW = wheelRow <= WHEEL_ROW_COMPACT ? 68 : 78;
  const sepColW = wheelRow <= WHEEL_ROW_COMPACT ? 26 : 30;
  const unitColW = wheelRow <= WHEEL_ROW_COMPACT ? 56 : 64;

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
      style={{
        backgroundColor: PALETTE.bg,
        color: PALETTE.text,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1 shrink-0">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#E4FFF2",
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

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-3 pb-2 shrink-0 [@media(max-height:700px)]:pt-3 [@media(max-height:700px)]:pb-2 [@media(min-height:701px)]:pt-5 [@media(min-height:701px)]:pb-4 [@media(min-height:800px)]:pt-7 [@media(min-height:800px)]:pb-5"
      >
        <h1
          className="text-[24px] font-semibold leading-tight tracking-tight [@media(max-height:700px)]:text-[21px] [@media(min-height:800px)]:text-[30px]"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
        <p
          className="mt-1.5 text-[15px] leading-snug [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:text-[13px] [@media(min-height:800px)]:mt-3 [@media(min-height:800px)]:text-[17px]"
          style={{ color: PALETTE.textMuted }}
        >
          {subtitle}
        </p>
      </motion.div>

      {/* Unit toggle — stay above the wheel card if the middle section overflows */}
      <div className="relative z-30 flex justify-center px-5 pb-3 shrink-0 [@media(max-height:700px)]:pb-2 [@media(min-height:800px)]:pb-5">
        <MintSegmentedControl
          options={unitOptions}
          value={unit}
          onChange={handleUnitChange}
          ariaLabel="Einheit"
        />
      </div>

      {/* Wheel picker card — top-aligned so a tall card cannot cover the unit toggle */}
      <div className="flex flex-1 min-h-0 flex-col items-center justify-start overflow-y-auto px-4 pb-2 pt-1">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-md rounded-[24px] p-3 [@media(max-height:700px)]:rounded-[22px] [@media(max-height:700px)]:p-2.5 [@media(min-height:800px)]:rounded-[28px] [@media(min-height:800px)]:p-5"
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
          <div
            className="pointer-events-none absolute inset-x-0 z-0 rounded-xl"
            style={{
              top: `calc(50% - ${wheelRow / 2}px)`,
              height: wheelRow,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 3px rgba(36,255,143,0.16)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 rounded-t-[24px] [@media(min-height:800px)]:rounded-t-[28px]"
            style={{
              height: WHEEL_PAD_ITEMS * wheelRow + 12,
              background:
                "linear-gradient(180deg, rgba(247,255,251,0.55) 0%, rgba(247,255,251,0.22) 55%, rgba(247,255,251,0) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 rounded-b-[24px] [@media(min-height:800px)]:rounded-b-[28px]"
            style={{
              height: WHEEL_PAD_ITEMS * wheelRow + 12,
              background:
                "linear-gradient(0deg, rgba(247,255,251,0.55) 0%, rgba(247,255,251,0.22) 55%, rgba(247,255,251,0) 100%)",
            }}
          />

          {/* Two wheels + separator + unit label */}
          <div className="relative z-10 flex items-stretch justify-center">
            <MintWheelColumn
              options={wholeOptions}
              value={whole}
              onChange={(v) => commitDisplay(v, decimal)}
              align="right"
              width={wholeColW}
              rowHeight={wheelRow}
              ariaLabel={`Gewicht ganz (${unitLabel})`}
            />
            <div className="relative shrink-0" style={{ width: sepColW }}>
              <span
                className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold [@media(max-height:700px)]:text-[20px] [@media(min-height:800px)]:text-[26px]"
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
              width={decimalColW}
              rowHeight={wheelRow}
              ariaLabel="Dezimal"
              circular
            />
            <div className="relative shrink-0" style={{ width: unitColW }}>
              <span
                className="absolute inset-0 flex items-center pl-2 text-[17px] font-medium [@media(max-height:700px)]:text-[16px] [@media(min-height:800px)]:pl-2.5 [@media(min-height:800px)]:text-[19px]"
                style={{ color: PALETTE.textMuted }}
              >
                {unitLabel}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Continue */}
      <div className="shrink-0 px-5 pt-3 pb-4 [@media(max-height:700px)]:pt-2 [@media(max-height:700px)]:pb-3 [@media(min-height:800px)]:pt-5 [@media(min-height:800px)]:pb-6">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] text-[15px] font-semibold text-white transition-all [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:text-[14px] [@media(min-height:800px)]:h-[58px] [@media(min-height:800px)]:text-[17px]"
          style={{
            background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            boxShadow:
              "0 10px 24px -8px rgba(18,217,120,0.55), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {t.next}
          <ChevronRight className="size-5 [@media(min-height:800px)]:size-6" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
