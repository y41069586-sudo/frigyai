import { Capacitor } from "@capacitor/core";
import { savePendingReferralCode } from "@/lib/referralCode";

/** Raw influencer ref from ChottuLink / ?ref= (3–20 chars) */
export const INFLUENCER_REF_KEY = "frigy_influencer_ref";

/** Set on web before install; applied on first native open */
export const DEFERRED_REF_KEY = "frigy_deferred_ref";

const FIRST_NATIVE_OPEN_KEY = "frigy_first_native_open_done";

const REF_PARAM_NAMES = ["ref", "referral", "code", "invite"] as const;

export function normalizeInfluencerRef(raw: string): string | null {
  const value = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20);
  if (value.length < 3) return null;
  return value;
}

export function extractRefFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const name of REF_PARAM_NAMES) {
    const value = params.get(name);
    if (value) {
      const normalized = normalizeInfluencerRef(value);
      if (normalized) return normalized;
    }
  }
  return null;
}

export function extractRefFromUrl(rawUrl: string): string | null {
  if (!rawUrl?.trim()) return null;
  try {
    const url = new URL(rawUrl);
    return extractRefFromSearch(url.search);
  } catch {
    const q = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
    return extractRefFromSearch(q);
  }
}

/**
 * Persist referral from any deep link / web URL.
 * 6-char codes also go to pending referral (existing redeem flow).
 */
export function captureReferralAttribution(ref: string, options?: { deferred?: boolean }): void {
  const normalized = normalizeInfluencerRef(ref);
  if (!normalized) return;

  if (options?.deferred) {
    localStorage.setItem(DEFERRED_REF_KEY, normalized);
  }

  localStorage.setItem(INFLUENCER_REF_KEY, normalized);

  if (normalized.length === 6) {
    savePendingReferralCode(normalized);
  }
}

export function getStoredInfluencerRef(): string | null {
  return localStorage.getItem(INFLUENCER_REF_KEY)?.trim() || null;
}

export function captureReferralFromUrl(rawUrl: string, options?: { deferred?: boolean }): string | null {
  const ref = extractRefFromUrl(rawUrl);
  if (!ref) return null;
  captureReferralAttribution(ref, options);
  return ref;
}

/** Web: user clicked ChottuLink but app not installed yet */
export function saveDeferredReferral(ref: string): void {
  captureReferralAttribution(ref, { deferred: true });
}

/**
 * First native app open: apply deferred ref from web pre-install click.
 * ChottuLink full deferred install attribution may still need their SDK.
 */
export function applyDeferredReferralOnFirstOpen(): void {
  const deferred = localStorage.getItem(DEFERRED_REF_KEY)?.trim();
  if (deferred) {
    captureReferralAttribution(deferred);
    localStorage.removeItem(DEFERRED_REF_KEY);
  }

  if (!Capacitor.isNativePlatform()) return;

  if (!localStorage.getItem(FIRST_NATIVE_OPEN_KEY)) {
    localStorage.setItem(FIRST_NATIVE_OPEN_KEY, String(Date.now()));
  }
}

export function captureReferralFromCurrentLocation(): string | null {
  if (typeof window === "undefined") return null;
  return captureReferralFromUrl(window.location.href);
}
