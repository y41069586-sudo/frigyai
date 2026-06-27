import type { User } from "@supabase/supabase-js";

/** Account existed before this sign-in (not a brand-new OAuth user in the last minute). */
export function isEstablishedAuthUser(user: User | null | undefined): boolean {
  if (!user) return false;

  const createdAt = new Date(user.created_at).getTime();
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : createdAt;

  if (Number.isFinite(createdAt) && Date.now() - createdAt > 5 * 60_000) {
    return true;
  }

  if (Number.isFinite(lastSignIn) && lastSignIn - createdAt > 90_000) {
    return true;
  }

  const identities = user.identities?.length ?? 0;
  if (identities > 1) return true;

  const providers = new Set(
    (user.identities ?? []).map((identity) => identity.provider).filter(Boolean),
  );
  if (providers.has("email") && (providers.has("google") || providers.has("apple"))) {
    return true;
  }

  return false;
}
