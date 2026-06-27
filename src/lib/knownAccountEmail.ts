const KNOWN_EMAILS_KEY = "frigy_known_account_emails";
const MAX_STORED = 30;

function readKnownEmails(): string[] {
  try {
    const raw = localStorage.getItem(KNOWN_EMAILS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((e): e is string => typeof e === "string").map((e) => e.trim().toLowerCase())
      : [];
  } catch {
    return [];
  }
}

export function markKnownAccountEmail(email: string | null | undefined): void {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return;

  try {
    const known = readKnownEmails();
    if (known.includes(normalized)) return;
    known.push(normalized);
    localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(known.slice(-MAX_STORED)));
  } catch {
    // ignore
  }
}

export function isKnownAccountEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return readKnownEmails().includes(normalized);
}
