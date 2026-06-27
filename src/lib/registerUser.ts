import { supabase } from "@/integrations/supabase/client";

export type RegisterUserResult =
  | { ok: true; existing?: boolean }
  | { ok: false; error: string; alreadyRegistered?: boolean };

/** Server-side signup with confirmed email (no confirmation mail). */
export async function registerUserWithoutEmailConfirm(
  email: string,
  password: string,
): Promise<RegisterUserResult> {
  const { data, error } = await supabase.functions.invoke("register-user", {
    body: { email: email.trim().toLowerCase(), password },
  });

  if (error) {
    return { ok: false, error: error.message || "Registrierung fehlgeschlagen" };
  }

  const payload = data as { success?: boolean; error?: string; existing?: boolean } | null;

  if (!payload?.success) {
    const msg = payload?.error ?? "Registrierung fehlgeschlagen";
    return {
      ok: false,
      error: msg,
      alreadyRegistered: msg === "already_registered" || msg.toLowerCase().includes("already"),
    };
  }

  return { ok: true, existing: payload.existing };
}
