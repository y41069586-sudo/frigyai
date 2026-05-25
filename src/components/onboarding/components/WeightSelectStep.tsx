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
  bg: "#F2FFF8",
  selectedBg: "#DCFEEF",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const KG_PER_LB = 0.45359237;

const sanitizeDecimalInput = (raw: string) => {
  let result = "";
  let separatorUsed = false;
  let decimals = 0;

  for (const char of raw) {
    if (/\d/.test(char)) {
      if (!separatorUsed) {
        result += char;
      } else if (decimals < 1) {
        result += char;
        decimals += 1;
      }
      continue;
    }

    if ((char === "." || char === ",") && !separatorUsed) {
      separatorUsed = true;
      result += char;
    }
  }

  return result;
};

const parseDecimalInput = (value: string) => {
  if (!value || value === "." || value === ",") {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDecimalInput = (value: number, separator: "." | ",") => {
  const formatted = value.toFixed(1);
  return separator === "," ? formatted.replace(".", ",") : formatted;
};

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
  const [weightInput, setWeightInput] = useState("");

  const unit = userData.weightUnit;
  const isMetric = unit === "metric";

  const totalKg = userData.weight + (userData.weightDecimal ?? 0) / 10;
  const totalLbs = totalKg / KG_PER_LB;

  const minWhole = isMetric ? 30 : 66;
  const maxWhole = isMetric ? 250 : 550;
  const separator: "." | "," = isMetric ? "," : ".";

  useEffect(() => {
    const nextDisplay = isMetric ? totalKg : totalLbs;
    setWeightInput(formatDecimalInput(nextDisplay, separator));
  }, [isMetric, separator, totalKg, totalLbs, userData.weight, userData.weightDecimal]);

  const parsedWeight = parseDecimalInput(weightInput);
  const canProceed =
    parsedWeight !== null &&
    parsedWeight >= minWhole &&
    parsedWeight <= maxWhole;

  const commitDisplay = (display: number) => {
    const kg = isMetric ? display : display * KG_PER_LB;
    const roundedKg = Math.round(kg * 10) / 10;
    const kgWhole = Math.floor(roundedKg);
    const kgDecimal = Math.max(0, Math.min(9, Math.round((roundedKg - kgWhole) * 10)));
    setUserData({ ...userData, weight: kgWhole, weightDecimal: kgDecimal });
  };

  const handleWeightChange = (raw: string) => {
    const nextValue = sanitizeDecimalInput(raw);
    setWeightInput(nextValue);

    const parsed = parseDecimalInput(nextValue);
    if (parsed === null || parsed < minWhole || parsed > maxWhole) {
      return;
    }

    commitDisplay(parsed);
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
              backgroundColor: "#F2FFF8",
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
      <div className="mt-4 flex shrink-0 justify-center px-5 pb-1">
        <MintSegmentedControl
          options={unitOptions}
          value={unit}
          onChange={handleUnitChange}
          ariaLabel="Einheit"
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
              inputMode="decimal"
              value={weightInput}
              onChange={(event) => handleWeightChange(event.target.value)}
              placeholder={isMetric ? "70,0" : "154.3"}
              aria-label={title}
              className="min-w-0 flex-1 bg-transparent text-center text-[28px] font-semibold tracking-[-0.04em] outline-none placeholder:text-[#9AB5A7]"
              style={{ color: PALETTE.text }}
            />
            <span className="shrink-0 text-[18px] font-semibold" style={{ color: PALETTE.textMuted }}>
              {unitLabel}
            </span>
          </div>

          <p
            className="mt-3 text-center text-[12px] font-medium"
            style={{ color: weightInput.length > 0 && !canProceed ? "#DC2626" : PALETTE.textMuted }}
          >
            {weightInput.length > 0 && !canProceed
              ? language === "de"
                ? isMetric
                  ? "Bitte gib ein Gewicht zwischen 30,0 und 250,0 kg ein."
                  : "Bitte gib ein Gewicht zwischen 66.0 und 550.0 lbs ein."
                : language === "fr"
                  ? isMetric
                    ? "Entre un poids entre 30,0 et 250,0 kg."
                    : "Entre un poids entre 66.0 et 550.0 lbs."
                  : isMetric
                    ? "Enter a weight between 30.0 and 250.0 kg."
                    : "Enter a weight between 66.0 and 550.0 lbs."
              : language === "de"
                ? isMetric
                  ? "Zum Beispiel 70,0"
                  : "Zum Beispiel 154.3"
                : language === "fr"
                  ? isMetric
                    ? "Par exemple 70,0"
                    : "Par exemple 154.3"
                  : isMetric
                    ? "For example 70.0"
                    : "For example 154.3"}
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
