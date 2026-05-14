import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Dispatch, SetStateAction } from "react";
import type { UserData } from "../types";
import { MintSegmentedControl } from "./MintSegmentedControl";

const PALETTE = {
  primary: "#7BE0B8",
  primaryDark: "#5BCB9F",
  primaryDeep: "#2DAA82",
  bg: "#F7FFFB",
  trackActive: "#7BE0B8",
  trackInactive: "#E8FFF4",
  text: "#1F2937",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
};

const KG_PER_LB = 0.45359237;

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
  currentIndex?: number;
  totalSteps?: number;
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
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  ticks: number[];
  formatTick: (v: number) => string;
  onActiveChange?: (active: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastMarkerRef = useRef<number | null>(null);

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = rect.width > 0 ? x / rect.width : 0;
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, parseFloat(snapped.toFixed(2))));
      onChange(clamped);
      const marker = Math.round(clamped);
      if (lastMarkerRef.current !== marker) {
        lastMarkerRef.current = marker;
        haptic(8);
      }
    },
    [min, max, step, onChange],
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
              boxShadow: "inset 0 1px 2px rgba(60,120,90,0.06)",
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
              boxShadow: "0 2px 6px rgba(91,203,159,0.35)",
            }}
          />
          {/* Major-marker dots on the track */}
          {ticks.map((t) => {
            const tp = ((t - min) / (max - min)) * 100;
            const isActive = t <= value + 1e-6;
            return (
              <div
                key={`dot-${t}`}
                className="absolute rounded-full"
                style={{
                  left: `${tp}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 3,
                  height: 3,
                  backgroundColor: isActive ? "rgba(255,255,255,0.85)" : "rgba(91,203,159,0.45)",
                }}
              />
            );
          })}
          {/* Thumb */}
          <motion.div
            className="absolute"
            animate={{ left: `${pct}%` }}
            transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.6 }}
            style={{
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 22,
              height: 22,
              borderRadius: 8,
              background: "linear-gradient(180deg, #FFFFFF 0%, #F7FFFB 100%)",
              border: `3px solid ${PALETTE.primary}`,
              boxShadow:
                "0 6px 16px -5px rgba(91,203,159,0.55), 0 2px 4px rgba(15,40,30,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          />
        </div>
      </div>
      {/* Tick labels */}
      <div className="relative mt-0.5 h-4 px-[1px]">
        {ticks.map((t) => {
          const tp = ((t - min) / (max - min)) * 100;
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
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language } = useLanguage();

  const isMetric = userData.weightUnit === "metric";
  const isGain = userData.goalMode === "gain";

  // weeklyGoal is always stored in kg/week. Default 0.5 kg.
  const kgPerWeek = Math.max(0.1, userData.weeklyGoal || 0.5);
  const lbsPerWeek = kgPerWeek / KG_PER_LB;

  const displayValue = isMetric
    ? Math.round(kgPerWeek * 10) / 10
    : Math.round(lbsPerWeek * 10) / 10;

  const min = isMetric ? 0.5 : 1.0;
  const max = isMetric ? 2.0 : 4.0;
  const step = 0.1;
  const ticks = isMetric ? [0.5, 1.0, 1.5, 2.0] : [1.0, 2.0, 3.0, 4.0];

  const clampedDisplay = Math.max(min, Math.min(max, displayValue));

  const [sliderActive, setSliderActive] = useState(false);

  const commit = (next: number) => {
    const kg = isMetric ? next : next * KG_PER_LB;
    const rounded = Math.round(kg * 100) / 100;
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
      subtitle: "Wähle deine bevorzugte Geschwindigkeit pro Woche.",
      labelLose: "Geschwindigkeit der Gewichtsabnahme",
      labelGain: "Geschwindigkeit der Gewichtszunahme",
      labelMaintain: "Wöchentliche Veränderung",
      next: "Weiter",
      back: "Zurück",
      unit: "Einheit",
      metric: "Metrisch",
    },
    en: {
      title: "How fast do you want to reach your goal?",
      subtitle: "Choose your preferred pace per week.",
      labelLose: "Weight loss pace",
      labelGain: "Weight gain pace",
      labelMaintain: "Weekly change",
      next: "Next",
      back: "Back",
      unit: "Unit",
      metric: "Metric",
    },
    fr: {
      title: "À quelle vitesse veux-tu atteindre ton objectif ?",
      subtitle: "Choisis ton rythme préféré par semaine.",
      labelLose: "Vitesse de perte de poids",
      labelGain: "Vitesse de prise de poids",
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
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Top bar: back + progress */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2 shrink-0">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label={t.back}
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

      {/* Title + Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-8 pb-2 shrink-0"
      >
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {t.title}
        </h1>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ color: PALETTE.textMuted }}
        >
          {t.subtitle}
        </p>
      </motion.div>

      {/* Slider area */}
      <div className="flex flex-1 min-h-0 flex-col justify-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-center text-[14px] font-medium"
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
              className="text-[44px] font-bold leading-none tracking-tight tabular-nums"
              style={{ color: PALETTE.text }}
            >
              {clampedDisplay.toFixed(1)}
            </span>
            <span
              className="ml-2 text-[18px] font-semibold tracking-tight"
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
        />

        {/* Unit toggle */}
        <div className="mt-7 flex justify-center">
          <MintSegmentedControl
            options={unitOptions}
            value={userData.weightUnit}
            onChange={handleUnitChange}
            ariaLabel={t.unit}
          />
        </div>
      </div>

      {/* Continue */}
      <div className="shrink-0 px-5 pt-3 pb-10">
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
