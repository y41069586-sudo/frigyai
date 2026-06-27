import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import {
  dismissStalledAuthNavigation,
  POST_AUTH_MANUAL_NAV_PATHS,
} from "@/lib/authCompletion";
import { shouldHideBottomNavForFirstPlan } from "@/lib/firstWeekPlanFlow";

/**
 * Bottom nav rendered outside RouteErrorBoundary so Wochenplan stays reachable
 * even when the page route throws and shows a loader/error shell.
 */
export function MainNavChrome() {
  const location = useLocation();
  const { user } = useAuth();
  const { isConfigured: trackerSetup, loading: trackerLoading } = useTrackerSettings();
  const pathname = location.pathname;

  useEffect(() => {
    if (POST_AUTH_MANUAL_NAV_PATHS.has(pathname)) {
      dismissStalledAuthNavigation();
    }
  }, [pathname, location.search]);

  if (pathname !== "/meal-plans") {
    return null;
  }

  // Logged-out users get redirected from meal-plans content; skip duplicate nav.
  if (!user || shouldHideBottomNavForFirstPlan()) {
    return null;
  }

  return (
    <BottomNavigation trackerSetup={trackerSetup} trackerLoading={trackerLoading} />
  );
}
