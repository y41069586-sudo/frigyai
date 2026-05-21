export {
  REFERRAL_ADMIN_EMAIL,
  REFERRAL_ADMIN_EMAILS,
  isReferralAdmin,
} from "./referralAdmin";

/** Admin Panel (/admin) – Premium per E-Mail vergeben */
export const PREMIUM_GRANT_ADMIN_EMAILS = [
  "yousef0087mohamed@gmail.com",
  "yousef0089mohamed@gmail.com",
] as const;

export function isPremiumGrantAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return PREMIUM_GRANT_ADMIN_EMAILS.some((e) => e === normalized);
}
