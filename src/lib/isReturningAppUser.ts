import { hasUserOnboardingRecord } from "@/lib/userRecord";

/** @deprecated Use `hasUserOnboardingRecord` — DB record only, no OAuth heuristics. */
export async function isReturningAppUser(userId: string): Promise<boolean> {
  return hasUserOnboardingRecord(userId);
}
