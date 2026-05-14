/**
 * QA / Entwicklung: Onboarding ohne Index-Checks (immer erreichbar unter /onboarding-preview).
 * Optional: `?step=apple-health-connect` (oder einen anderen Eintrag aus `onboardingSteps`).
 * Danach zurück zur Startseite.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { onboardingSteps, type OnboardingStep } from "@/components/onboarding/types";

export default function OnboardingPreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedStep = searchParams.get("step") as OnboardingStep | null;
  const initialStep =
    requestedStep && onboardingSteps.includes(requestedStep) ? requestedStep : undefined;

  return (
    <OnboardingFlow
      initialStep={initialStep}
      onComplete={() => {
        navigate("/", { replace: true });
      }}
    />
  );
}
