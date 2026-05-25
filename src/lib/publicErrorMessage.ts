const TECHNICAL_ERROR_PATTERNS = [
  "supabase",
  "edge function",
  "non-2xx",
  "failed to fetch",
  "load failed",
  "functions.invoke",
  "schema cache",
  "relation ",
  "postgres",
  "jwt",
  "row-level",
  "rls",
  "networkerror",
  "auth session missing",
  "invalid api key",
  "invalid jwt",
  "fetch",
];

export function getPublicErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message) return fallback;

  const normalized = message.toLowerCase();
  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return fallback;
  }

  return message;
}
