import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/PageLoader";
import { hasUserOnboardingRecord } from "@/lib/userRecord";

type AuthGuardProps = {
  children: ReactNode;
  /** When true, requires `user_onboarding` row (existing user). Otherwise redirects to paywall. */
  requireUserRecord?: boolean;
};

/**
 * Protects routes that need an authenticated session (and optionally an app user record).
 */
export function AuthGuard({ children, requireUserRecord = true }: AuthGuardProps) {
  const { user, loading, sessionRestoring } = useAuth();
  const location = useLocation();
  const [recordChecked, setRecordChecked] = useState(!requireUserRecord);
  const [hasRecord, setHasRecord] = useState(false);

  useEffect(() => {
    if (!requireUserRecord || !user) {
      setRecordChecked(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const exists = await hasUserOnboardingRecord(user.id);
      if (!cancelled) {
        setHasRecord(exists);
        setRecordChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, requireUserRecord]);

  if (loading || sessionRestoring || (user && requireUserRecord && !recordChecked)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (requireUserRecord && !hasRecord) {
    return <Navigate to="/?onboardingStep=paywall" replace />;
  }

  return <>{children}</>;
}
