/** Clears the fixed mint progress line above step headers. */
export const MINT_STEP_HEADER_PT =
  "calc(env(safe-area-inset-top, 0px) + 1.375rem)";

/** Mint onboarding step question (h1). */
export const ONBOARDING_QUESTION_CLASS =
  "text-[19px] font-semibold leading-snug tracking-tight";

/** Uppercase question variant (e.g. Apple Health). */
export const ONBOARDING_QUESTION_UPPER_CLASS =
  "text-[17px] font-bold uppercase leading-snug tracking-wide";

/** Skip staggered child entrance on mobile to avoid double-animation jank with step transitions. */
export const shouldSkipMintStepEntrance = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

export const mintStepChildInitial = (offsetY = 10) =>
  shouldSkipMintStepEntrance() ? false : ({ opacity: 0, y: offsetY } as const);

export const mintStepChildTransition = (duration = 0.4) =>
  shouldSkipMintStepEntrance()
    ? { duration: 0 }
    : { duration, ease: [0.4, 0, 0.2, 1] as const };
