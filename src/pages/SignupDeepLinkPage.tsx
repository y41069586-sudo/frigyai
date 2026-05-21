import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import { captureReferralFromUrl } from "@/lib/referralAttribution";

/** HTTPS target for ChottuLink / Universal Links: /signup?ref=… */
export default function SignupDeepLinkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    captureReferralFromUrl(window.location.href);
    const ref = searchParams.get("ref");
    navigate(
      ref
        ? `/?onboardingStep=referral-code&ref=${encodeURIComponent(ref)}`
        : "/?onboardingStep=referral-code",
      { replace: true },
    );
  }, [navigate, searchParams]);

  return <PageLoader />;
}
