import { isAppLinkHost } from "@/lib/chottuLinkConfig";
import { extractRefFromSearch } from "@/lib/referralAttribution";
import { FRIGY_APP_SCHEME } from "@/lib/appScheme";

// Re-exported for backward compatibility — defined in its own leaf module to
// avoid the appDeepLink <-> chottuLinkConfig circular import.
export { FRIGY_APP_SCHEME };

/**
 * Deep link after successful subscription checkout (native App).
 */
export const SUBSCRIPTION_SUCCESS_DEEP_LINK = `${FRIGY_APP_SCHEME}://callback?subscription=success`;

export type DeepLinkResolution = {
  path: string | null;
  referralRef: string | null;
};

/**
 * Maps frigy://… or https://app-host/… to react-router path + optional ?ref=.
 */
export function resolveDeepLink(rawUrl: string): DeepLinkResolution {
  const empty: DeepLinkResolution = { path: null, referralRef: null };
  if (!rawUrl?.trim()) return empty;

  try {
    const url = new URL(rawUrl);
    const referralRef = extractRefFromSearch(url.search);

    if (url.protocol === `${FRIGY_APP_SCHEME}:`) {
      const path = resolveFrigySchemePath(url);
      return { path, referralRef };
    }

    if (url.protocol === "https:" || url.protocol === "http:") {
      if (isAppLinkHost(url.hostname)) {
        const path = resolveHttpsAppLinkPath(url);
        return { path, referralRef };
      }
      if (isSignupPath(url.pathname)) {
        return { path: buildSignupRoute(url.search), referralRef };
      }
      if (url.search.includes("subscription=success")) {
        return { path: ensureSubscriptionSuccessPath(url.search), referralRef };
      }
      const path = url.pathname || "/";
      const search = url.search || "";
      if (path.startsWith("/")) {
        return { path: `${path}${search}`, referralRef };
      }
    }
  } catch {
    const path = resolveFrigySchemePathFallback(rawUrl);
    const referralRef = extractRefFromSearch(
      rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "",
    );
    return { path, referralRef };
  }

  return empty;
}

/** @deprecated Use resolveDeepLink — returns path only */
export function resolveDeepLinkPath(rawUrl: string): string | null {
  return resolveDeepLink(rawUrl).path;
}

function resolveHttpsAppLinkPath(url: URL): string | null {
  const path = url.pathname || "/";
  const search = url.search || "";

  if (isSignupPath(path)) {
    return buildSignupRoute(search);
  }

  if (search.includes("subscription=success")) {
    return ensureSubscriptionSuccessPath(search);
  }

  if (path.startsWith("/")) {
    return `${path}${search}`;
  }

  return null;
}

function isSignupPath(path: string): boolean {
  const p = path.toLowerCase().replace(/\/+$/, "") || "/";
  return p === "/signup" || p === "/invite" || p === "/referral";
}

function buildSignupRoute(search: string): string {
  const ref = extractRefFromSearch(search);
  if (ref) {
    return `/?onboardingStep=referral-code&ref=${encodeURIComponent(ref)}`;
  }
  return "/?onboardingStep=referral-code";
}

function resolveFrigySchemePath(url: URL): string | null {
  const host = url.hostname?.toLowerCase() ?? "";
  const path = url.pathname?.toLowerCase() ?? "";
  const search = url.search ?? "";

  if (host === "signup" || host === "invite" || host === "referral") {
    return buildSignupRoute(search);
  }

  if (isSignupPath(path)) {
    return buildSignupRoute(search);
  }

  if (search.includes("subscription=success")) {
    return ensureSubscriptionSuccessPath(search);
  }

  if (host === "callback" || host === "subscription" || host === "payment") {
    if (path.includes("success") || search) {
      return search ? ensureSubscriptionSuccessPath(search) : "/?subscription=success";
    }
  }

  if (path.includes("subscription") && path.includes("success")) {
    return "/?subscription=success";
  }

  if (host && !path && !search) {
    return `/${host}`;
  }

  return search ? `/${host}${path}${search}` : path ? `/${host}${path}` : null;
}

function resolveFrigySchemePathFallback(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("subscription=success")) {
    return "/?subscription=success";
  }
  if (normalized.includes("frigy://signup") || normalized.includes("frigy://invite")) {
    const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
    return buildSignupRoute(q);
  }
  if (normalized.startsWith(`${FRIGY_APP_SCHEME}://`)) {
    const rest = raw.slice(`${FRIGY_APP_SCHEME}://`.length);
    if (rest.includes("?")) {
      const q = rest.slice(rest.indexOf("?"));
      return ensureSubscriptionSuccessPath(q.startsWith("?") ? q : `?${q}`);
    }
  }
  return null;
}

function ensureSubscriptionSuccessPath(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("subscription") === "success") {
    return "/?subscription=success";
  }
  params.set("subscription", "success");
  return `/?${params.toString()}`;
}
