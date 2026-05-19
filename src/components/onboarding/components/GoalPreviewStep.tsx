import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { ONBOARDING_PALETTE as PALETTE } from "../palette";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

function formatKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

type ChartPt = { x: number; y: number };
type CubicSeg = [ChartPt, ChartPt, ChartPt, ChartPt];

function cubicSegToPath(seg: CubicSeg): string {
  const [p0, p1, p2, p3] = seg;
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

/** Ohne-Frigy: sanft schräg hoch, tiefere Spitze, ab Spitze gestrichelt — ein durchgehender Pfad */
function buildWithoutFrigyPath(
  x0: number,
  x1: number,
  yStart: number,
  yTop: number,
  yBot: number,
  direction: "lose" | "maintain" | "gain",
): { fullPath: string; solidRatio: number; endY: number } {
  const angle = Math.tan((38 * Math.PI) / 180);
  const peakY = Math.max(yTop + 16, yStart - 34);
  const rise = yStart - peakY;
  const peakX = Math.min(x0 + rise / angle, x0 + (x1 - x0) * 0.5);

  const endY =
    direction === "maintain"
      ? Math.min(yBot - 6, yStart + 10)
      : Math.min(yBot - 6, yStart + 14);

  const peakRound = 28;
  const runUp = peakX - x0;
  const runDown = x1 - peakX;

  const up: CubicSeg = [
    { x: x0, y: yStart },
    { x: x0 + runUp * 0.58, y: yStart - rise * 0.58 },
    { x: peakX - peakRound, y: peakY },
    { x: peakX, y: peakY },
  ];
  const down: CubicSeg = [
    { x: peakX, y: peakY },
    { x: peakX + peakRound, y: peakY },
    { x: x1 - 44, y: endY + 6 },
    { x: x1, y: endY },
  ];

  const fullPath = `${cubicSegToPath(up)} C ${down[1].x} ${down[1].y}, ${down[2].x} ${down[2].y}, ${down[3].x} ${down[3].y}`;
  const solidRatio = runUp / Math.max(runUp + runDown, 1);

  return { fullPath, solidRatio, endY };
}

export function GoalPreviewStep({
  userData,
  onBack,
  onNext,
}: Props) {
  const { language } = useLanguage();

  const currentKg = userData.weight + (userData.weightDecimal ?? 0) / 10;
  const targetKg = userData.targetWeight + (userData.targetWeightDecimal ?? 0) / 10;
  const deltaKg = Math.abs(targetKg - currentKg);
  const direction: "lose" | "maintain" | "gain" =
    userData.goalMode === "maintain"
      ? "maintain"
      : targetKg < currentKg
        ? "lose"
        : targetKg > currentKg
          ? "gain"
          : "maintain";

  const labels = {
    de: {
      maintain: "BEREIT, DEIN GEWICHT ZU HALTEN — EIN ERREICHBARES ZIEL!",
      subtitle:
        "Die Veränderungen nach der Anwendung von Frigy sind deutlich und dauerhaft.",
      yourWeight: "Ihr Gewicht",
      withFrigy: "Mit Frigy",
      withoutFrigy: "Ohne Frigy",
      next: "Weiter",
    },
    en: {
      maintain: "READY TO MAINTAIN YOUR WEIGHT — AN ACHIEVABLE GOAL!",
      subtitle:
        "Illustrative comparison from your inputs — motivational only, not a medical forecast.",
      yourWeight: "Your weight",
      withFrigy: "With Frigy",
      withoutFrigy: "Without Frigy",
      next: "Next",
    },
    fr: {
      maintain: "PRÊT À MAINTENIR TON POIDS — UN OBJECTIF ATTEIGNABLE !",
      subtitle:
        "Les changements après l’utilisation de Frigy sont nets et durables.",
      yourWeight: "Ton poids",
      withFrigy: "Avec Frigy",
      withoutFrigy: "Sans Frigy",
      next: "Suivant",
    },
  } as const;
  const lng = (["de", "en", "fr"] as const).includes(language as never)
    ? (language as "de" | "en" | "fr")
    : "de";
  const L = labels[lng];

  const deltaText = formatKg(deltaKg);

  const headlineParts:
    | { kind: "lose" | "gain"; pre: string; mid: string; post: string }
    | { kind: "maintain"; full: string } =
    direction === "maintain"
      ? { kind: "maintain", full: L.maintain }
      : direction === "lose"
        ? lng === "de"
          ? { kind: "lose", pre: "BEREIT,", mid: `${deltaText} KG`, post: "ABZUNEHMEN — EIN ERREICHBARES ZIEL!" }
          : lng === "en"
            ? { kind: "lose", pre: "READY TO LOSE", mid: `${deltaText} KG`, post: "— AN ACHIEVABLE GOAL!" }
            : { kind: "lose", pre: "PRÊT À PERDRE", mid: `${deltaText} KG`, post: "— UN OBJECTIF ATTEIGNABLE !" }
        : lng === "de"
          ? { kind: "gain", pre: "BEREIT,", mid: `${deltaText} KG`, post: "ZUZUNEHMEN — EIN ERREICHBARES ZIEL!" }
          : lng === "en"
            ? { kind: "gain", pre: "READY TO GAIN", mid: `${deltaText} KG`, post: "— AN ACHIEVABLE GOAL!" }
            : { kind: "gain", pre: "PRÊT À PRENDRE", mid: `${deltaText} KG`, post: "— UN OBJECTIF ATTEIGNABLE !" };

  // ── SVG chart geometry ────────────────────────────────────────────────────
  const W = 320;
  const H = 200;
  const padL = 28;
  const padR = 28;
  const padT = 38;
  const padB = 38;
  const x0 = padL;
  const x1 = W - padR;
  const yTop = padT;
  const yBot = H - padB;

  // All modes: success starts at bottom-left and rises toward top-right
  // (progress-arc style — visually motivational regardless of weight direction).
  const yStart = yBot - 4;
  const yEnd =
    direction === "maintain" ? (yTop + yBot) / 2 - 4 : yTop + 18;

  const mainPath = `M ${x0} ${yStart} C ${x0 + 90} ${yStart}, ${x1 - 90} ${yEnd}, ${x1} ${yEnd}`;
  const areaPath = `${mainPath} L ${x1} ${yBot} L ${x0} ${yBot} Z`;

  const { fullPath: badFullPath, solidRatio: badSolidRatio, endY: endBadY } = buildWithoutFrigyPath(
    x0,
    x1,
    yStart,
    yTop,
    yBot,
    direction,
  );

  const badMeasureRef = useRef<SVGPathElement>(null);
  const [badStroke, setBadStroke] = useState({ solid: 95, gap: 200 });

  useLayoutEffect(() => {
    const el = badMeasureRef.current;
    if (!el) return;
    const total = el.getTotalLength();
    const solid = total * badSolidRatio;
    setBadStroke({ solid, gap: Math.max(total - solid, 1) });
  }, [badFullPath, badSolidRatio]);

  const CHART_ANIM_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
  const CHART_LINE_DURATION = 1.5;
  const BAD_LINE_ANIM = { delay: 0.5, duration: CHART_LINE_DURATION, ease: CHART_ANIM_EASE };

  const gridLineYs = [
    yStart,
    yStart + (yBot - yStart) * 0.38,
    yStart + (yBot - yStart) * 0.72,
    yBot - 2,
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

      <OnboardingMascotQuestion className="pb-1">
        {headlineParts.kind === "maintain" ? (
          <h1
            className="text-[17px] font-extrabold uppercase leading-[1.15] tracking-tight"
            style={{ color: PALETTE.text }}
          >
            {headlineParts.full}
          </h1>
        ) : (
          <h1
            className="text-[17px] font-extrabold uppercase leading-[1.15] tracking-tight"
            style={{ color: PALETTE.text }}
          >
            {headlineParts.pre}{" "}
            <motion.span
              animate={{ scale: [1, 1.035, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block whitespace-nowrap"
              style={{ color: PALETTE.primaryDeep, transformOrigin: "center" }}
            >
              {headlineParts.mid}
            </motion.span>{" "}
            {headlineParts.post}
          </h1>
        )}
      </OnboardingMascotQuestion>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="mx-auto mt-1 max-w-prose px-6 text-[15px] font-medium leading-snug"
        style={{ color: PALETTE.textMuted }}
      >
        {L.subtitle}
      </motion.p>

      {/* Chart card */}
      <div className="flex flex-1 min-h-0 items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-md rounded-[28px] p-4"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: `1px solid ${PALETTE.cardBorderIdle}`,
            boxShadow:
              "0 24px 50px -24px rgba(10,120,75,0.18), 0 4px 14px -6px rgba(10,120,75,0.08)",
          }}
        >
          <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="mintAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.primary} stopOpacity="0.7" />
                  <stop offset="60%" stopColor={PALETTE.primary} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={PALETTE.primary} stopOpacity="0.08" />
                </linearGradient>
                <linearGradient id="mintStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={PALETTE.primaryDeep} />
                  <stop offset="100%" stopColor={PALETTE.primaryDark} />
                </linearGradient>
              </defs>

              {/* Dezente Diagramm-Linien (Baseline + Raster) */}
              {gridLineYs.map((gy, i) => (
                <line
                  key={`grid-${i}`}
                  x1={x0}
                  y1={gy}
                  x2={x1}
                  y2={gy}
                  stroke="#D1D5DB"
                  strokeWidth={i === 0 ? 0.85 : 0.55}
                  strokeDasharray={i === 0 ? "4 6" : "2 7"}
                  strokeOpacity={i === 0 ? 0.55 : 0.32}
                  strokeLinecap="round"
                />
              ))}

              {/* Gradient fill under success curve */}
              <motion.path
                d={areaPath}
                fill="url(#mintAreaFill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              />

              {/* Ohne Frigy: eine durchlaufende Animation (gestrichelt + solid-Overlay) */}
              <motion.path
                ref={badMeasureRef}
                d={badFullPath}
                fill="none"
                stroke={PALETTE.badLine}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={BAD_LINE_ANIM}
              />
              <motion.path
                d={badFullPath}
                fill="none"
                stroke={PALETTE.badLine}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${badStroke.solid} ${badStroke.gap}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={BAD_LINE_ANIM}
              />

              {/* Main success curve */}
              <motion.path
                d={mainPath}
                fill="none"
                stroke="url(#mintStroke)"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: CHART_LINE_DURATION, ease: CHART_ANIM_EASE }}
              />
              <motion.path
                d={mainPath}
                fill="none"
                stroke={PALETTE.primary}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="18 260"
                initial={{ opacity: 0, pathLength: 0, strokeDashoffset: 0 }}
                animate={{ opacity: [0, 0.45, 0], pathLength: 1, strokeDashoffset: [80, -180] }}
                transition={{
                  opacity: { delay: 1.2, duration: 1.3, repeat: Infinity, repeatDelay: 1.5 },
                  pathLength: { delay: 1.2, duration: 1.3, repeat: Infinity, repeatDelay: 1.5 },
                  strokeDashoffset: { delay: 1.2, duration: 1.3, repeat: Infinity, repeatDelay: 1.5 },
                }}
              />

              {/* Start dot */}
              <motion.circle
                cx={x0}
                cy={yStart}
                r="5"
                fill="white"
                stroke={PALETTE.primaryDeep}
                strokeWidth="2.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                style={{ transformOrigin: `${x0}px ${yStart}px` }}
              />

              {/* End dot success */}
              <motion.circle
                cx={x1}
                cy={yEnd}
                r="11"
                fill={PALETTE.primary}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0.7, 1.55, 0.7], opacity: [0.35, 0, 0.35] }}
                transition={{ delay: 1.55, duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: `${x1}px ${yEnd}px` }}
              />
              <motion.circle
                cx={x1}
                cy={yEnd}
                r="6"
                fill={PALETTE.primary}
                stroke="white"
                strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: `${x1}px ${yEnd}px` }}
              />

              {/* End dot Ohne Frigy */}
              <motion.circle
                cx={x1}
                cy={endBadY}
                r="5"
                fill={PALETTE.badLine}
                stroke="white"
                strokeWidth="2.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: `${x1}px ${endBadY}px` }}
              />

              {/* Chart labels — same coordinate system as dots */}
              <motion.text
                x={padL}
                y={padT - 10}
                fill={PALETTE.textMuted}
                fontSize="11"
                fontWeight="500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {L.yourWeight}
              </motion.text>

              <motion.text
                x={x1}
                y={yEnd - 16}
                textAnchor="middle"
                fill={PALETTE.primaryDeep}
                fontSize="12"
                fontWeight="800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.4 }}
              >
                {L.withFrigy}
              </motion.text>

              <motion.text
                x={x1}
                y={endBadY + 22}
                textAnchor="middle"
                fill={PALETTE.badLineDeep}
                fontSize="12"
                fontWeight="800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.4 }}
              >
                {L.withoutFrigy}
              </motion.text>
            </svg>
          </div>
        </motion.div>
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
          {L.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
