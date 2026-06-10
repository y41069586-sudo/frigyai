/** Mint onboarding palette (progress line, accents). */
export const ONBOARDING_MINT_PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  selectedBg: "#DCFEEF",
  progressTrack: "#DCFEEF",
  progressFill: "linear-gradient(90deg, #BCFDDC 0%, #75FBB2 55%, #39D47F 100%)",
} as const;

/** Clears the fixed mint progress line above step headers. */
export const MINT_STEP_HEADER_PT =
  "calc(env(safe-area-inset-top, 0px) + 1.375rem)";

/** Mint onboarding step question (h1). */
export const ONBOARDING_QUESTION_CLASS =
  "text-[19px] font-semibold leading-snug tracking-tight";

/** Uppercase question variant (e.g. Apple Health). */
export const ONBOARDING_QUESTION_UPPER_CLASS =
  "text-[17px] font-bold uppercase leading-snug tracking-wide";

export type MintStepDirection = 1 | -1;

/** GPU-friendly slide + fade between mint steps (small x on mobile to avoid layout jank). */
export function getMintStepTransition(isMobile: boolean) {
  return {
    duration: isMobile ? 0.28 : 0.32,
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

export function getMintStepVariants(isMobile: boolean) {
  const enterX = isMobile ? 12 : 20;
  const exitX = isMobile ? 8 : 14;
  return {
    initial: (direction: MintStepDirection) => ({
      opacity: 0,
      x: direction * enterX,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: MintStepDirection) => ({
      opacity: 0,
      x: direction * -exitX,
    }),
  };
}

/** Child steps skip their own entrance — parent AnimatePresence handles step transitions. */
export const shouldSkipMintStepEntrance = () => true;

export const mintStepChildInitial = (offsetY = 10) =>
  shouldSkipMintStepEntrance() ? false : ({ opacity: 0, y: offsetY } as const);

export const mintStepChildTransition = (duration = 0.4) =>
  shouldSkipMintStepEntrance()
    ? { duration: 0 }
    : { duration, ease: [0.4, 0, 0.2, 1] as const };
