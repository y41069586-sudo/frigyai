/** Custom URL scheme — must match iOS Info.plist & Android intent-filter */
export const FRIGY_APP_SCHEME = "frigy";

/**
 * Stripe Payment Link → „Nach dem Bezahlen“ (native App).
 * Alternative Web: https://DEINE-DOMAIN/?subscription=success
 */
export const STRIPE_APP_DEEP_LINK_SUCCESS = `${FRIGY_APP_SCHEME}://callback?subscription=success`;

/**
 * Maps frigy://… or https://your-domain/… to an in-app react-router path.
 */
export function resolveDeepLinkPath(rawUrl: string): string | null {
  if (!rawUrl?.trim()) return null;

  try {
    const url = new URL(rawUrl);

    if (url.protocol === `${FRIGY_APP_SCHEME}:`) {
      return resolveFrigySchemePath(url);
    }

    if (url.protocol === "https:" || url.protocol === "http:") {
      const path = url.pathname || "/";
      const search = url.search || "";
      if (path.startsWith("/")) {
        return `${path}${search}`;
      }
    }
  } catch {
    return resolveFrigySchemePathFallback(rawUrl);
  }

  return null;
}

function resolveFrigySchemePath(url: URL): string | null {
  const host = url.hostname?.toLowerCase() ?? "";
  const path = url.pathname?.toLowerCase() ?? "";
  const search = url.search ?? "";

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
