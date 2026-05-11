/**
 * QA / Entwicklung: Onboarding ohne Index-Checks (immer erreichbar unter /onboarding-preview).
 * Danach zurück zur Startseite.
 */
import { useNavigate } from "react-router-dom";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function OnboardingPreviewPage() {
  const navigate = useNavigate();
  return (
    <OnboardingFlow
      onComplete={() => {
        navigate("/", { replace: true });
      }}
    />
  );
}
