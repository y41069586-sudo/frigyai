import { FRIGY_APP_SCHEME } from "@/lib/appDeepLink";

/**
 * ChottuLink / App-Link hosts — set in production .env:
 * VITE_CHOTTULINK_HOST=dein-projekt.chottu.link
 * VITE_APP_WEB_HOST=app.frigy.app
 */
export const CHOTTULINK_HOST =
  (import.meta.env.VITE_CHOTTULINK_HOST as string | undefined)?.trim() || "frigy.chottu.link";

export const APP_WEB_HOST =
  (import.meta.env.VITE_APP_WEB_HOST as string | undefined)?.trim() || "app.frigy.app";

/** Hosts that may open the app via Universal / App Links */
export const APP_LINK_HOSTS = [CHOTTULINK_HOST, APP_WEB_HOST].filter(Boolean);

/** iOS Team ID for apple-app-site-association (Xcode → Signing) */
export const IOS_TEAM_ID =
  (import.meta.env.VITE_IOS_TEAM_ID as string | undefined)?.trim() || "TEAMID";

export const IOS_BUNDLE_ID = "com.frigy.app";

export const ANDROID_PACKAGE = "com.frigy.app";

/** ChottuLink dashboard → Destination URL (deep link target) */
export const CHOTTU_LINK_DESTINATION_URL = `${FRIGY_APP_SCHEME}://signup?ref={ref}`;

/** Alternative destination (HTTPS — Universal / App Links) */
export const CHOTTU_LINK_WEB_DESTINATION_URL = `https://${APP_WEB_HOST}/signup?ref={ref}`;

/** Example influencer link (custom scheme) */
export const DEEP_LINK_EXAMPLE = `${FRIGY_APP_SCHEME}://signup?ref=proml`;

export function buildSignupDeepLink(ref: string): string {
  const code = ref.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `${FRIGY_APP_SCHEME}://signup?ref=${encodeURIComponent(code)}`;
}

export function buildSignupWebUrl(ref: string): string {
  const code = ref.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `https://${APP_WEB_HOST}/signup?ref=${encodeURIComponent(code)}`;
}

export function isAppLinkHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return APP_LINK_HOSTS.some((h) => host === h.toLowerCase());
}
