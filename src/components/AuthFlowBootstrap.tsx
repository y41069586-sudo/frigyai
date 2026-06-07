import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAuthFlowSnapshot,
  dismissStalledAuthNavigation,
  isAuthFlowOverlayVisible,
  NAV_EXECUTION_TIMEOUT_MS,
  POST_AUTH_MANUAL_NAV_PATHS,
  recoverFromStuckAuthNavigation,
  resetAuthFlow,
  subscribeAuthFlow,
  type AuthFlowSnapshot,
} from "@/lib/authCompletion";
import {
  executeAuthNavigation,
  runStashedOAuthCompletion,
  scheduleStashedOAuthRetry,
} from "@/lib/authRouter";
import { peekStashedOAuthCallbackUrl } from "@/lib/oauthCallbackRecovery";
import { getOAuthPending } from "@/lib/oauthPending";
import frigLogo from "@/assets/frigy-mascot.png";

/**
 * After AuthContext bootstrap: process stashed native OAuth (single pipeline).
 */
export function AuthFlowBootstrap() {
  const navigate = useNavigate();
  const { checkSubscription, loading } = useAuth();
  const triggeredRef = useRef(false);

  const tryStashed = () => {
    if (loading || triggeredRef.current) return;
    if (!peekStashedOAuthCallbackUrl()) return;

    triggeredRef.current = true;
    void runStashedOAuthCompletion({ checkSubscription, navigate }).finally(() => {
      triggeredRef.current = false;
    });
  };

  useEffect(() => {
    if (loading) return;
    if (!peekStashedOAuthCallbackUrl() && !getOAuthPending()) return;

    tryStashed();
    scheduleStashedOAuthRetry({ checkSubscription, navigate });
  }, [loading, checkSubscription, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) tryStashed();
    }).then((handle) => () => {
      void handle.remove();
    });
  }, [loading, checkSubscription, navigate]);

  return null;
}

/**
 * Single router executor — syncs result → navigation.executed.
 */
export function AuthFlowRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeAuthFlow(() => {
      const snap = getAuthFlowSnapshot();
      const { result, navigation } = snap;

      if (result.status !== "success" && result.status !== "error") return;
      if (navigation.failed) return;
      if (navigation.executed || navigation.executing) return;

      executeAuthNavigation(result, navigate);
    });
  }, [navigate]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const { navigation } = getAuthFlowSnapshot();
      if (!navigation.executing || navigation.executed || navigation.startedAt == null) {
        return;
      }
      if (Date.now() - navigation.startedAt >= NAV_EXECUTION_TIMEOUT_MS) {
        recoverFromStuckAuthNavigation();
      }
    }, 500);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return subscribeAuthFlow(() => {
      const { result, navigation } = getAuthFlowSnapshot();
      if (
        navigation.executed &&
        (result.status === "success" || result.status === "error")
      ) {
        window.setTimeout(() => resetAuthFlow(), 1200);
      }
    });
  }, []);

  return null;
}

function overlayLabel(snap: AuthFlowSnapshot): string {
  const { result, navigation } = snap;

  if (navigation.executing) return "Weiterleitung…";
  if (result.status === "pending") {
    if (result.phase === "oauth_exchange") return "OAuth wird abgeschlossen…";
    if (result.phase === "session") return "Session wird bestätigt…";
    return "Zugang wird geprüft…";
  }
  if (result.status === "success") return "Weiterleitung…";
  return "Anmeldung wird abgeschlossen…";
}

/** UI reads snapshot only — overlay until navigation.executed. */
export function AuthFlowOverlay() {
  const location = useLocation();
  const [snap, setSnap] = useState<AuthFlowSnapshot>(getAuthFlowSnapshot());

  useEffect(() => subscribeAuthFlow(() => setSnap(getAuthFlowSnapshot())), []);

  useEffect(() => {
    if (!POST_AUTH_MANUAL_NAV_PATHS.has(location.pathname)) return;
    if (isAuthFlowOverlayVisible()) return;
    dismissStalledAuthNavigation();
  }, [location.pathname]);

  if (!isAuthFlowOverlayVisible()) {
    return null;
  }

  if (snap.result.status === "error" && !snap.navigation.executing) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <img src={frigLogo} alt="Frigy" className="mx-auto mb-4 h-12 w-12 rounded-xl" />
          <p className="mb-4 text-sm text-muted-foreground">{snap.result.reason}</p>
          <button
            type="button"
            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => {
              resetAuthFlow();
              window.location.replace("/auth");
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm px-6">
      <div className="text-center">
        <img src={frigLogo} alt="Frigy" className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-xl" />
        <p className="text-sm text-muted-foreground">{overlayLabel(snap)}</p>
      </div>
    </div>
  );
}
