import type { Language } from "@/contexts/LanguageContext";

const MESSAGES: Record<
  Language,
  {
    alreadyRegistered: string;
    emailNotConfirmed: string;
    invalidCredentials: string;
  }
> = {
  de: {
    alreadyRegistered: "Diese E-Mail ist bereits registriert. Bitte melde dich an.",
    emailNotConfirmed:
      "Du musst deine E-Mail nicht bestätigen. Melde dich einfach mit E-Mail und Passwort an.",
    invalidCredentials: "E-Mail oder Passwort ist falsch.",
  },
  en: {
    alreadyRegistered: "This email is already registered. Please sign in.",
    emailNotConfirmed:
      "You don't need to confirm your email. Just sign in with your email and password.",
    invalidCredentials: "Incorrect email or password.",
  },
  fr: {
    alreadyRegistered: "Cet e-mail est déjà inscrit. Connecte-toi.",
    emailNotConfirmed:
      "Tu n'as pas besoin de confirmer ton e-mail. Connecte-toi avec ton e-mail et ton mot de passe.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
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
  return msg.includes("already registered") || msg.includes("user already registered");
}

export function resolveAuthErrorMessage(
  error: { message?: string } | null | undefined,
  language: Language,
  mode: "signup" | "login",
): ResolvedAuthError | null {
  if (!error?.message) return null;

  const msg = error.message.toLowerCase();
  const t = MESSAGES[language] ?? MESSAGES.de;

  if (isUserAlreadyRegistered(error)) {
    return { message: t.alreadyRegistered, switchToLogin: true, variant: "error" };
  }

  if (isEmailNotConfirmed(error)) {
    return { message: t.emailNotConfirmed, switchToLogin: true, variant: "info" };
  }

  if (mode === "login" && msg.includes("invalid login credentials")) {
    return { message: t.invalidCredentials, variant: "error" };
  }

  return { message: error.message, variant: "error" };
}
