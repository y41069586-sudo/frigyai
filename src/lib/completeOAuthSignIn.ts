import type { NavigateFunction } from "react-router-dom";
import { isOAuthCallbackUrl, isOAuthErrorUrl } from "@/lib/authOAuth";
import { clearOAuthPending, resolveFromOnboarding } from "@/lib/oauthPending";
import { clearStashedOAuthCallbackUrl } from "@/lib/oauthCallbackRecovery";
import { publishAuthResult, getAuthFlowSnapshot, type AuthResult } from "@/lib/authCompletion";
import {
  runAuthCompletion,
  runStashedOAuthCompletion,
  scheduleStashedOAuthRetry,
} from "@/lib/authRouter";
import type { SubscriptionStatusLike } from "@/lib/subscription";

export type OAuthCallbackResult = AuthResult;

export async function handleOAuthCallbackUrl(options: {
  url: string;
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  navigate: NavigateFunction;
  onExchangeSuccess?: () => void;
  allowDefer?: boolean;
}): Promise<OAuthCallbackResult> {
  const { url, checkSubscription, navigate, onExchangeSuccess, allowDefer = true } = options;

  if (isOAuthErrorUrl(url)) {
    clearOAuthPending();
    clearStashedOAuthCallbackUrl();
    publishAuthResult({
      status: "error",
      reason: "Google/Apple-Anmeldung fehlgeschlagen.",
      exitRoute: "/auth?oauth_error=1",
    });
    return getAuthFlowSnapshot().result;
  }

  if (!isOAuthCallbackUrl(url)) {
    return { status: "ignored" };
  }

  return runAuthCompletion({
    oauthUrl: url,
    checkSubscription,
    navigate,
    fromOnboarding: resolveFromOnboarding(url),
    onOAuthExchangeSuccess: onExchangeSuccess,
    allowOAuthDefer: allowDefer,
  });
}

export async function processStashedOAuthCallback(options: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  navigate: NavigateFunction;
}): Promise<OAuthCallbackResult> {
  return runStashedOAuthCompletion(options);
}

export { scheduleStashedOAuthRetry };
