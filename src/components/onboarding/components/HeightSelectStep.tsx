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

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalSteps?: number;
};

export function HeightSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
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

  const subtitle =
    language === "de"
      ? "Das hilft uns deinen Plan besser anzupassen."
      : language === "fr"
        ? "Cela nous aide à mieux adapter ton plan."
        : "This helps us tailor your plan better.";

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
          key={unit}
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

          {/* Content depends on unit */}
          {isMetric ? (
            <div className="relative z-10 flex items-stretch justify-center">
              <MintWheelColumn
                options={cmOptions}
                value={heightCm}
                onChange={handleCmChange}
                align="right"
                width={150}
                ariaLabel="cm"
              />
              <div className="relative shrink-0" style={{ width: 70 }}>
                <span
                  className="absolute inset-0 flex items-center pl-3 text-[18px] font-medium"
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
                width={80}
                ariaLabel="Fuß"
              />
              <div className="relative shrink-0" style={{ width: 50 }}>
                <span
                  className="absolute inset-0 flex items-center pl-2 text-[18px] font-medium"
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
                width={70}
                ariaLabel="Zoll"
              />
              <div className="relative shrink-0" style={{ width: 50 }}>
                <span
                  className="absolute inset-0 flex items-center pl-2 text-[18px] font-medium"
                  style={{ color: PALETTE.textMuted }}
                >
                  in
                </span>
              </div>
            </div>
          )}
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
