import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import type { UserData } from "../types";
import { MintSegmentedControl } from "./MintSegmentedControl";

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  primaryDeep: "#2EB56D",
  bg: "#F2FFF8",
  trackActive: "#75FBB2",
  trackInactive: "#DCFEEF",
  text: "#1F2937",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
};

const KG_PER_LB = 0.45359237;
const MIN_PACE_KG = 0.1;
const MAX_PACE_KG = 1.0;
const CENTER_PACE_KG = 0.5;

const haptic = (ms = 8) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(ms);
    }
  } catch {
    /* noop */
  }
};

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

function MintSlider({
  min,
  max,
  step,
  value,
  onChange,
  ticks,
  formatTick,
  onActiveChange,
  centerValue,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  ticks: number[];
  formatTick: (v: number) => string;
  onActiveChange?: (active: boolean) => void;
  centerValue?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastMarkerRef = useRef<number | null>(null);

  const valueToRatio = useCallback(
    (nextValue: number) => {
      const clampedValue = Math.max(min, Math.min(max, nextValue));

      if (!centerValue || centerValue <= min || centerValue >= max) {
        return (clampedValue - min) / (max - min);
      }

      if (clampedValue <= centerValue) {
        return ((clampedValue - min) / (centerValue - min)) * 0.5;
      }

      return 0.5 + ((clampedValue - centerValue) / (max - centerValue)) * 0.5;
    },
    [centerValue, max, min],
  );

  const ratioToValue = useCallback(
    (ratio: number) => {
      const clampedRatio = Math.max(0, Math.min(1, ratio));

      if (!centerValue || centerValue <= min || centerValue >= max) {
        return min + clampedRatio * (max - min);
      }

      if (clampedRatio <= 0.5) {
        return min + (clampedRatio / 0.5) * (centerValue - min);
      }

      return centerValue + ((clampedRatio - 0.5) / 0.5) * (max - centerValue);
    },
    [centerValue, max, min],
  );

  const pct = Math.max(0, Math.min(100, valueToRatio(value) * 100));

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = rect.width > 0 ? x / rect.width : 0;
      const raw = ratioToValue(ratio);
      const snapped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, parseFloat(snapped.toFixed(2))));
      onChange(clamped);
      const marker = Math.round(clamped);
      if (lastMarkerRef.current !== marker) {
        lastMarkerRef.current = marker;
        haptic(8);
      }
    },
    [max, min, onChange, ratioToValue, step],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    onActiveChange?.(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    haptic(6);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    onActiveChange?.(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="select-none">
      <div
        className="relative touch-none"
        style={{ height: 42 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={trackRef}
          className="absolute left-0 right-0"
          style={{ top: "50%", transform: "translateY(-50%)", height: 24 }}
        >
          {/* Inactive track */}
          <div
            className="absolute left-0 right-0 rounded-full"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              height: 7,
              backgroundColor: PALETTE.trackInactive,
              boxShadow: "inset 0 1px 2px rgba(10,120,75,0.06)",
            }}
          />
          {/* Active track */}
          <div
            className="absolute left-0 rounded-full"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              height: 7,
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
              boxShadow: "0 2px 6px rgba(74, 232, 150,0.35)",
              transition: draggingRef.current ? "none" : "width 120ms ease-out",
            }}
          />
          {/* Thumb */}
          <div
            className="absolute"
            style={{
              left: `${pct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 22,
              height: 22,
              borderRadius: 9999,
              background: "linear-gradient(180deg, #FFFFFF 0%, #FEFFFE 100%)",
              border: `3px solid ${PALETTE.primary}`,
              boxShadow:
                "0 6px 16px -5px rgba(74, 232, 150,0.55), 0 2px 4px rgba(15,40,30,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              transition: draggingRef.current ? "none" : "left 120ms ease-out",
            }}
          />
        </div>
      </div>
      {/* Tick labels — positions match slider scale so 0.5 sits at 50% */}
      <div className="relative mt-0.5 h-4">
        {ticks.map((t) => {
          const tp = valueToRatio(t) * 100;
          const isActive = Math.abs(t - value) < step * 0.55;
          return (
            <div
              key={`label-${t}`}
              className="absolute text-[11px] font-medium tabular-nums"
              style={{
                left: `${tp}%`,
                top: 0,
                transform: "translateX(-50%)",
                color: isActive ? PALETTE.primaryDeep : PALETTE.textMuted,
                transition: "color 160ms ease",
              }}
            >
              {formatTick(t)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PaceSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language } = useLanguage();

  const isMetric = userData.weightUnit === "metric";
  const isGain = userData.goalMode === "gain";

  // weeklyGoal stored in kg/week — range 0.1–1.0 kg
  const kgPerWeek = Math.min(MAX_PACE_KG, Math.max(MIN_PACE_KG, userData.weeklyGoal ?? 0.5));
  const lbsPerWeek = kgPerWeek / KG_PER_LB;

  const displayValue = isMetric
    ? Math.round(kgPerWeek * 10) / 10
    : Math.round(lbsPerWeek * 10) / 10;

  const min = isMetric ? MIN_PACE_KG : Math.round((MIN_PACE_KG / KG_PER_LB) * 10) / 10;
  const max = isMetric ? MAX_PACE_KG : Math.round((MAX_PACE_KG / KG_PER_LB) * 10) / 10;
  const step = 0.1;
  const ticks = isMetric
    ? [MIN_PACE_KG, 0.5, MAX_PACE_KG]
    : [min, Math.round((0.5 / KG_PER_LB) * 10) / 10, max];

  const clampedDisplay = Math.max(min, Math.min(max, displayValue));

  useEffect(() => {
    if ((userData.weeklyGoal ?? 0.5) < MIN_PACE_KG) {
      setUserData((prev) => ({ ...prev, weeklyGoal: MIN_PACE_KG }));
    }
  }, [setUserData, userData.weeklyGoal]);

  const [sliderActive, setSliderActive] = useState(false);

  const commit = (next: number) => {
    const clamped = Math.max(min, Math.min(max, next));
    const kg = isMetric ? clamped : clamped * KG_PER_LB;
    const rounded = Math.round(Math.max(MIN_PACE_KG, Math.min(MAX_PACE_KG, kg)) * 100) / 100;
    setUserData((prev) => ({ ...prev, weeklyGoal: rounded }));
  };

  const handleUnitChange = (nextUnit: "metric" | "imperial") => {
    if (nextUnit === userData.weightUnit) return;
    setUserData((prev) => ({ ...prev, weightUnit: nextUnit }));
  };

  // i18n
  const L = {
    de: {
      title: "Wie schnell möchtest du dein Ziel erreichen?",
      labelLose: "Geschwindigkeit der Gewichtsabnahme pro Woche",
      labelGain: "Geschwindigkeit der Gewichtszunahme pro Woche",
      labelMaintain: "Wöchentliche Veränderung",
      next: "Weiter",
      back: "Zurück",
      unit: "Einheit",
      metric: "Metrisch",
    },
    en: {
      title: "How fast do you want to reach your goal?",
      labelLose: "Weight loss pace per week",
      labelGain: "Weight gain pace per week",
      labelMaintain: "Weekly change",
      next: "Next",
      back: "Back",
      unit: "Unit",
      metric: "Metric",
    },
    fr: {
      title: "À quelle vitesse veux-tu atteindre ton objectif ?",
      labelLose: "Vitesse de perte de poids par semaine",
      labelGain: "Vitesse de prise de poids par semaine",
      labelMaintain: "Variation hebdomadaire",
      next: "Suivant",
      back: "Retour",
      unit: "Unité",
      metric: "Métrique",
    },
  } as const;
  const lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as "de" | "en" | "fr")
    : "de";
  const t = L[lng];

  const directionLabel =
    userData.goalMode === "maintain"
      ? t.labelMaintain
      : isGain
        ? t.labelGain
        : t.labelLose;

  const unitOptions: { id: "metric" | "imperial"; label: string }[] = [
    { id: "metric", label: t.metric },
    { id: "imperial", label: "Imperial" },
  ];

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Top bar: back + progress */}
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+1.375rem)]">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label={t.back}
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
          {t.title}
        </h1>
      </OnboardingMascotQuestion>

      {/* Slider area */}
      <div className="mt-6 flex flex-1 min-h-0 flex-col justify-center px-4 pt-1">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="whitespace-nowrap text-center text-[11.5px] font-medium leading-tight tracking-tight"
          style={{ color: PALETTE.textMuted }}
        >
          {directionLabel}
        </motion.p>

        <motion.div
          key={isMetric ? "m" : "i"}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-3 mb-8 text-center"
        >
          <motion.div
            animate={{ scale: sliderActive ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="inline-flex items-baseline"
          >
            <span
              className="text-[30px] font-bold leading-none tracking-tight tabular-nums"
              style={{ color: PALETTE.text }}
            >
              {clampedDisplay.toFixed(1)}
            </span>
            <span
              className="ml-1.5 text-[15px] font-semibold tracking-tight"
              style={{ color: PALETTE.primaryDeep }}
            >
              {isMetric ? "kg" : "lbs"}
            </span>
          </motion.div>
        </motion.div>

        <MintSlider
          min={min}
          max={max}
          step={step}
          value={clampedDisplay}
          onChange={commit}
          ticks={ticks}
          formatTick={(v) => v.toFixed(1)}
          onActiveChange={setSliderActive}
          centerValue={isMetric ? CENTER_PACE_KG : Math.round((CENTER_PACE_KG / KG_PER_LB) * 10) / 10}
        />

        {/* Unit toggle */}
        <div className="mt-10 flex justify-center">
          <MintSegmentedControl
            options={unitOptions}
            value={userData.weightUnit}
            onChange={handleUnitChange}
            ariaLabel={t.unit}
          />
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
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            boxShadow:
              "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
