/** Einzige E-Mail mit Zugriff auf Empfehlungscode-Verwaltung in den Einstellungen */
export const REFERRAL_ADMIN_EMAIL = "yousef0087mohamed@gmail.com";

export function isReferralAdmin(email: string | undefined | null): boolean {
  return email?.toLowerCase() === REFERRAL_ADMIN_EMAIL;
}
