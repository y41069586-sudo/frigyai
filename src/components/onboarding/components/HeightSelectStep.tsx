import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Dispatch, SetStateAction } from "react";
import type { UserData } from "../types";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import { MintSegmentedControl } from "./MintSegmentedControl";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#FBFFFD",
  selectedBg: "#DCFEEF",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sanitizeMetricHeightInput = (raw: string) => raw.replace(/\D/g, "").slice(0, 3);

const formatImperialHeight = (feet: number, inches: number) => `${feet}'${inches}`;

const parseImperialHeight = (value: string) => {
  const parts = value.match(/\d+/g);
  if (!parts || parts.length < 2) {
    return null;
  }

  const feet = Number(parts[0]);
  const inches = Number(parts[1]);

  if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
    return null;
  }

  if (feet < 3 || feet > 8 || inches < 0 || inches > 11) {
    return null;
  }

  const cm = Math.round((feet * INCHES_PER_FOOT + inches) * CM_PER_INCH);
  return { feet, inches, cm };
};

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
  const { t } = useLanguage();
  const [heightInput, setHeightInput] = useState("");

  const unit = userData.heightUnit;
  const isMetric = unit === "metric";

  const heightCm = userData.height;

  const totalInches = heightCm / CM_PER_INCH;
  const feetFromCm = Math.max(3, Math.min(8, Math.floor(totalInches / INCHES_PER_FOOT)));
  const inchesFromCm = Math.max(
    0,
    Math.min(11, Math.round(totalInches - feetFromCm * INCHES_PER_FOOT)),
  );

  const handleCmChange = (cm: number) => {
    const roundedTotalInches = Math.round(cm / CM_PER_INCH);
    const derivedFeet = clamp(Math.floor(roundedTotalInches / INCHES_PER_FOOT), 3, 8);
    const derivedInches = clamp(roundedTotalInches - derivedFeet * INCHES_PER_FOOT, 0, 11);
    setUserData({
      ...userData,
      height: cm,
      heightFeet: derivedFeet,
      heightInches: derivedInches,
      heightConfirmed: true,
    });
  };

  useEffect(() => {
    if (!userData.heightConfirmed) {
      setHeightInput("");
      return;
    }

    setHeightInput(isMetric ? String(heightCm) : formatImperialHeight(feetFromCm, inchesFromCm));
  }, [feetFromCm, heightCm, inchesFromCm, isMetric, userData.height, userData.heightConfirmed]);

  const handleUnitChange = (nextUnit: "metric" | "imperial") => {
    if (nextUnit === unit) return;
    setUserData({ ...userData, heightUnit: nextUnit });
  };

  const title = t.onboardingHowTallTitle;

  const unitOptions: { id: "metric" | "imperial"; label: string }[] = [
    { id: "metric", label: t.onboardingUnitMetric },
    { id: "imperial", label: t.onboardingUnitImperial },
  ];

  const parsedMetricHeight =
    isMetric && heightInput.length > 0 ? Number(heightInput) : null;
  const parsedImperialHeight = !isMetric ? parseImperialHeight(heightInput) : null;
  const canProceed = isMetric
    ? parsedMetricHeight !== null && Number.isFinite(parsedMetricHeight) && parsedMetricHeight >= 100 && parsedMetricHeight <= 250
    : parsedImperialHeight !== null;

  const helperText = isMetric ? t.onboardingHeightHelperMetric : t.onboardingHeightHelperImperial;
  const errorText = isMetric ? t.onboardingHeightErrorMetric : t.onboardingHeightErrorImperial;

  const handleHeightChange = (raw: string) => {
    const nextValue = isMetric ? sanitizeMetricHeightInput(raw) : raw.replace(/[^\d' ftin]/gi, "");
    setHeightInput(nextValue);

    if (isMetric) {
      const parsed = Number(nextValue);
      if (!Number.isFinite(parsed) || parsed < 100 || parsed > 250) {
        return;
      }

      handleCmChange(parsed);
      return;
    }

    const parsed = parseImperialHeight(nextValue);
    if (!parsed) {
      return;
    }

    setUserData({
      ...userData,
      height: parsed.cm,
      heightFeet: parsed.feet,
      heightInches: parsed.inches,
      heightConfirmed: true,
    });
  };

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
            aria-label={t.back}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#FBFFFD",
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
      <div className="mt-7 flex shrink-0 justify-center px-5 pb-1 sm:mt-4">
        <MintSegmentedControl
          options={unitOptions}
          value={unit}
          onChange={handleUnitChange}
          ariaLabel={t.onboardingUnitAriaLabel}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center px-5">
        <div className="mx-auto w-full max-w-[320px]">
          <div
            className="flex items-center gap-3 rounded-[24px] border px-5 py-4 shadow-[0_18px_45px_-28px_rgba(57,212,127,0.45)]"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#6EECC0" }}
          >
            <input
              type="text"
              inputMode={isMetric ? "numeric" : "text"}
              value={heightInput}
              onChange={(event) => handleHeightChange(event.target.value)}
              placeholder={isMetric ? "170" : "5'7"}
              aria-label={title}
              className="min-w-0 flex-1 bg-transparent text-center text-[28px] font-semibold tracking-[-0.04em] outline-none placeholder:text-[#9AB5A7]"
              style={{ color: PALETTE.text }}
            />
            <span className="shrink-0 text-[18px] font-semibold" style={{ color: PALETTE.textMuted }}>
              {isMetric ? "cm" : "ft/in"}
            </span>
          </div>

          <p
            className="mt-3 text-center text-[12px] font-medium"
            style={{ color: heightInput.length > 0 && !canProceed ? "#DC2626" : PALETTE.textMuted }}
          >
            {heightInput.length > 0 && !canProceed ? errorText : helperText}
          </p>
        </div>
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
          onClick={canProceed ? onNext : undefined}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #DFF9EA 0%, #C8F4DD 100%)",
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
    </div>
  );
}
