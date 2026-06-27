/**
 * Supabase `functions.invoke` often sets a generic message when status !== 2xx.
 * The real `{ error: "..." }` body is on `error.context` (Response).
 */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  data?: { error?: string; message?: string } | null,
): Promise<string> {
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (error instanceof Error && error.message && !error.message.includes("non-2xx")) {
    return error.message;
  }

  const context = (error as { context?: Response })?.context;
  if (context) {
    try {
      const text = await context.clone().text();
      if (text) {
        try {
          const parsed = JSON.parse(text) as { error?: string; message?: string };
          if (parsed.message) return parsed.message;
          if (parsed.error) return parsed.error;
        } catch {
          if (text.length < 300) return text;
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (error instanceof Error) return error.message;
  return "Anfrage fehlgeschlagen";
}
