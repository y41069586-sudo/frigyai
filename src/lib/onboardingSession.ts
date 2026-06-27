import { onboardingSteps, type OnboardingStep } from "@/components/onboarding/types";

const KEY_IN_PROGRESS = "frigy_onboarding_in_progress";
const KEY_RESUME_STEP = "frigy_onboarding_resume_step";
const KEY_OAUTH_PENDING = "frigy_onboarding_oauth_pending";

const RESUME_STEPS = new Set<OnboardingStep>([
  "splash",
  "gender",
  "birthdate",
  "weight",
  "height",
  "activity",
  "main-goal",
  "target-weight",
  "goal-preview",
  "speed-select",
  "health-goals",
  "dietary-preferences",
  "allergies",
  "weekly-plan-preview",
  "scan-fridge",
  "shopping-list",
  "notification-prefs",
  "data-consent",
  "referral-code",
  "analyzing",
  "macro-preview",
  "save-progress",
  "paywall",
]);

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function markOnboardingInProgress(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(KEY_IN_PROGRESS, "1");
  } catch {
    // ignore quota / private mode
  }
}

export function clearOnboardingSession(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.removeItem(KEY_IN_PROGRESS);
    sessionStorage.removeItem(KEY_RESUME_STEP);
    sessionStorage.removeItem(KEY_OAUTH_PENDING);
  } catch {
    // ignore
  }
}

export function isOnboardingInProgress(): boolean {
  if (!canUseSessionStorage()) return false;
  try {
    return sessionStorage.getItem(KEY_IN_PROGRESS) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingResumeStep(step: OnboardingStep): void {
  if (!canUseSessionStorage() || !RESUME_STEPS.has(step)) return;
  try {
    sessionStorage.setItem(KEY_RESUME_STEP, step);
  } catch {
    // ignore
  }
}

export function getOnboardingResumeStep(): OnboardingStep | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(KEY_RESUME_STEP);
    if (!raw) return null;
    return RESUME_STEPS.has(raw as OnboardingStep) ? (raw as OnboardingStep) : null;
  } catch {
    return null;
  }
}

export function markOnboardingOAuthPending(provider: "google" | "apple"): void {
  if (!canUseSessionStorage()) return;
  try {
    markOnboardingInProgress();
    sessionStorage.setItem(KEY_OAUTH_PENDING, provider);
  } catch {
    // ignore
  }
}

export function isOnboardingOAuthPending(): boolean {
  if (!canUseSessionStorage()) return false;
  try {
    return sessionStorage.getItem(KEY_OAUTH_PENDING) === "google" || sessionStorage.getItem(KEY_OAUTH_PENDING) === "apple";
  } catch {
    return false;
  }
}

export function clearOnboardingOAuthPending(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.removeItem(KEY_OAUTH_PENDING);
  } catch {
    // ignore
  }
}

/** User is still in questionnaire flow — don't hijack to paywall after background auth. */
export function shouldDeferAuthPaywallRedirect(step?: OnboardingStep | null): boolean {
  if (!isOnboardingInProgress()) return false;

  const resolved = step ?? getOnboardingResumeStep();
  if (!resolved) return true;

  const stepIndex = onboardingSteps.indexOf(resolved);
  const saveProgressIndex = onboardingSteps.indexOf("save-progress");
  if (stepIndex < 0 || saveProgressIndex < 0) return false;

  return stepIndex < saveProgressIndex;
}

/** User already passed the first onboarding screen — don't reset to gender. */
export function shouldDeferAuthOnboardingStartRedirect(step?: OnboardingStep | null): boolean {
  if (!isOnboardingInProgress()) return false;

  const resolved = step ?? getOnboardingResumeStep();
  if (!resolved) return false;

  const stepIndex = onboardingSteps.indexOf(resolved);
  const genderIndex = onboardingSteps.indexOf("gender");
  if (stepIndex < 0 || genderIndex < 0) return false;

  return stepIndex > genderIndex;
}
