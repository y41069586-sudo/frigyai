import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "frigy_referral_code";
/** Valid referral entered during onboarding → skip paywall after signup */
export const REFERRAL_SKIP_PAYWALL_KEY = "frigy_referral_skip_paywall";

export function markReferralSkipPaywall(): void {
  localStorage.setItem(REFERRAL_SKIP_PAYWALL_KEY, "1");
}

export function hasReferralSkipPaywallPending(): boolean {
  return localStorage.getItem(REFERRAL_SKIP_PAYWALL_KEY) === "1";
}

export function consumeReferralSkipPaywall(): boolean {
  const skip = hasReferralSkipPaywallPending();
  if (skip) localStorage.removeItem(REFERRAL_SKIP_PAYWALL_KEY);
  return skip;
}

export function getPendingReferralCode(): string | null {
  const value = localStorage.getItem(STORAGE_KEY)?.trim().toUpperCase();
  return value && value.length === 6 ? value : null;
}

export function clearPendingReferralCode(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function savePendingReferralCode(code: string): void {
  const normalized = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  if (normalized.length === 6) {
    localStorage.setItem(STORAGE_KEY, normalized);
  }
}

export type ValidateReferralResult = {
  valid: boolean;
  code?: string;
  influencer_name?: string | null;
  duration_days?: number;
  is_lifetime?: boolean;
  error?: string;
};

export function isReferralLifetime(durationDays?: number | null, isLifetime?: boolean): boolean {
  return isLifetime === true || durationDays === 0;
}

export async function validateReferralCode(code: string): Promise<ValidateReferralResult> {
  const raw = code.replace(/[^a-zA-Z0-9]/g, "");
  if (raw.length < 3) {
    return { valid: false, error: "Ungültiger Code" };
  }

  const { data, error } = await supabase.functions.invoke("validate-referral-code", {
    body: { code: raw, ref: raw, slug: raw.toLowerCase() },
  });

  if (error) {
    return { valid: false, error: error.message || "Prüfung fehlgeschlagen" };
  }

  return data as ValidateReferralResult;
}

export type RedeemReferralResult = {
  success: boolean;
  message?: string;
  error?: string;
  already_redeemed?: boolean;
  subscription_end?: string;
};

/** Einlösen nach Login/Registrierung (ein Code pro Nutzer). */
export async function redeemPendingReferralCode(
  accessToken: string,
): Promise<RedeemReferralResult> {
  const code = getPendingReferralCode();
  if (!code) {
    return { success: false, error: "no_code" };
  }

  const { data, error } = await supabase.functions.invoke("redeem-referral-code", {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { code },
  });

  if (error) {
    console.warn("[referral] redeem failed:", error);
    return { success: false, error: error.message || "Einlösung fehlgeschlagen" };
  }

  if (data?.success) {
    clearPendingReferralCode();
    return data as RedeemReferralResult;
  }

  return {
    success: false,
    error: (data as { error?: string })?.error || "Ungültiger Code",
  };
}

export async function redeemReferralCode(
  accessToken: string,
  code: string,
): Promise<RedeemReferralResult> {
  savePendingReferralCode(code);
  return redeemPendingReferralCode(accessToken);
}
