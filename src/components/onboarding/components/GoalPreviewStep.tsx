import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";

const PALETTE = {
  primary: "#24F59B",
  primaryDark: "#10C878",
  primaryDeep: "#0A8550",
  bg: "#F2FFF8",
  highlight: "#D6FFE9",
  text: "#1F2937",
  textMuted: "#6B7280",
  cardBorderIdle: "#D1D5DB",
  badLine: "#C8232C",
  badLineDeep: "#A0181F",
};

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

  // Bad ("Ohne Frigy") curve — gentle hump above start, then back down to near start
  const peakY = Math.max(yTop + 12, yStart - 30);
  const endBadY = Math.min(yBot - 4, yStart + 4);

  const mainPath = `M ${x0} ${yStart} C ${x0 + 90} ${yStart}, ${x1 - 90} ${yEnd}, ${x1} ${yEnd}`;
  const areaPath = `${mainPath} L ${x1} ${yBot} L ${x0} ${yBot} Z`;
  const badPath = `M ${x0} ${yStart} C ${x0 + 70} ${peakY}, ${x1 - 70} ${peakY}, ${x1} ${endBadY}`;

  const endXPct = (x1 / W) * 100;
  const endMitYPct = (yEnd / H) * 100;
  const endOhneYPct = (endBadY / H) * 100;

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
              preserveAspectRatio="none"
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

              {/* Gradient fill under success curve */}
              <motion.path
                d={areaPath}
                fill="url(#mintAreaFill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              />

              {/* Without-Frigy: light red, up-then-down */}
              {direction !== "maintain" && (
                <motion.path
                  d={badPath}
                  fill="none"
                  stroke={PALETTE.badLine}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="6 7"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}

              {/* Main success curve */}
              <motion.path
                d={mainPath}
                fill="none"
                stroke="url(#mintStroke)"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
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
                r="6"
                fill={PALETTE.primary}
                stroke="white"
                strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: `${x1}px ${yEnd}px` }}
              />

              {/* End dot bad */}
              {direction !== "maintain" && (
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
              )}
            </svg>

            {/* "Ihr Gewicht" — static, top-left, subtle grey */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="pointer-events-none absolute left-0 top-0 text-[11px] font-medium"
              style={{
                color: PALETTE.textMuted,
                whiteSpace: "nowrap",
              }}
            >
              {L.yourWeight}
            </motion.div>

            {/* "Mit Frigy" — directly ABOVE the green endpoint dot */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.4 }}
              className="pointer-events-none absolute text-[11.5px] font-semibold"
              style={{
                left: `${endXPct}%`,
                top: `${endMitYPct}%`,
                transform: "translate(-50%, calc(-100% - 14px))",
                color: PALETTE.primaryDeep,
                whiteSpace: "nowrap",
              }}
            >
              {L.withFrigy}
            </motion.div>

            {/* "Ohne Frigy" — directly BELOW the red endpoint dot */}
            {direction !== "maintain" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.4 }}
                className="pointer-events-none absolute text-[11.5px] font-semibold"
                style={{
                  left: `${endXPct}%`,
                  top: `${endOhneYPct}%`,
                  transform: "translate(-50%, calc(100% + 12px))",
                  color: PALETTE.badLineDeep,
                  whiteSpace: "nowrap",
                }}
              >
                {L.withoutFrigy}
              </motion.div>
            )}
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
              "0 10px 24px -8px rgba(24,168,114,0.55), 0 2px 4px rgba(15,40,30,0.05)",
          }}
        >
          {L.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
