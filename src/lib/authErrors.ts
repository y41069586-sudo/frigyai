import type { Language } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const MESSAGES: Record<
  Language,
  {
    alreadyRegistered: string;
    emailNotConfirmed: string;
    invalidCredentials: string;
    emailRateLimit: string;
  }
> = {
  de: {
    alreadyRegistered: "Mit dieser E-Mail bist du schon registriert. Bitte melde dich an.",
    emailNotConfirmed:
      "Du musst deine E-Mail nicht bestätigen. Melde dich einfach mit E-Mail und Passwort an.",
    invalidCredentials: "E-Mail oder Passwort ist falsch.",
    emailRateLimit:
      "Zu viele Versuche in kurzer Zeit. Warte ein paar Minuten oder melde dich an, falls du schon ein Konto hast.",
  },
  en: {
    alreadyRegistered: "You already registered with this email. Please sign in.",
    emailNotConfirmed:
      "You don't need to confirm your email. Just sign in with your email and password.",
    invalidCredentials: "Incorrect email or password.",
    emailRateLimit:
      "Too many attempts in a short time. Wait a few minutes or sign in if you already have an account.",
  },
  fr: {
    alreadyRegistered: "Tu es déjà inscrit avec cet e-mail. Connecte-toi.",
    emailNotConfirmed:
      "Tu n'as pas besoin de confirmer ton e-mail. Connecte-toi avec ton e-mail et ton mot de passe.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    emailRateLimit:
      "Trop de tentatives en peu de temps. Attends quelques minutes ou connecte-toi si tu as déjà un compte.",
  },
};

export type ResolvedAuthError = {
  message: string;
  switchToLogin?: boolean;
  variant: "info" | "error";
};

export function isEmailNotConfirmed(error: { message?: string } | null | undefined): boolean {
  return (error?.message?.toLowerCase() ?? "").includes("email not confirmed");
}

export function isUserAlreadyRegistered(error: { message?: string } | null | undefined): boolean {
  const msg = error?.message?.toLowerCase() ?? "";
  return (
    msg.includes("already registered") ||
    msg.includes("user already registered") ||
    msg.includes("already been registered") ||
    msg.includes("schon registriert") ||
    msg.includes("déjà inscrit")
  );
}

/** Supabase returns a user with empty identities when the email already exists. */
export function isSignupExistingUserNoIdentities(user: { identities?: unknown[] } | null | undefined): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

export function isEmailRateLimited(error: { message?: string; code?: string } | null | undefined): boolean {
  const msg = error?.message?.toLowerCase() ?? "";
  const code = error?.code?.toLowerCase() ?? "";
  return (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    msg.includes("email rate limit") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("email limit")
  );
}

/** Wait for Supabase session after signUp (auth listener / delayed session). */
export async function waitForAuthSession(maxMs = 2800): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    await new Promise((resolve) => setTimeout(resolve, 160));
  }
  return false;
}

export function resolveAuthErrorMessage(
  error: { message?: string } | null | undefined,
  language: Language,
  mode: "signup" | "login",
): ResolvedAuthError | null {
  if (!error?.message) return null;

  const msg = error.message.toLowerCase();
  const t = MESSAGES[language] ?? MESSAGES.de;

  if (isEmailRateLimited(error)) {
    return { message: t.emailRateLimit, switchToLogin: true, variant: "error" };
  }

  if (isUserAlreadyRegistered(error)) {
    return { message: t.alreadyRegistered, switchToLogin: true, variant: "error" };
  }

  if (isEmailNotConfirmed(error)) {
    if (mode === "signup") return null;
    return { message: t.emailNotConfirmed, switchToLogin: true, variant: "info" };
  }

  if (mode === "login" && msg.includes("invalid login credentials")) {
    return { message: t.invalidCredentials, variant: "error" };
  }

  return { message: error.message, variant: "error" };
}
