/** E-Mails mit Zugriff auf Affiliate-/Empfehlungscode-Verwaltung (Profil → Einstellungen). */
export const REFERRAL_ADMIN_EMAILS = [
  "yousef0087mohamed@gmail.com",
  "yousef0089mohamed@gmail.com",
] as const;

/** @deprecated Use REFERRAL_ADMIN_EMAILS */
export const REFERRAL_ADMIN_EMAIL = REFERRAL_ADMIN_EMAILS[0];

export function isReferralAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return REFERRAL_ADMIN_EMAILS.some((e) => e === normalized);
}
