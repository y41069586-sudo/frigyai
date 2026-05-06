export const SHOPPING_CHECKED_NAMES_KEY = "frigy_shopping_checked_names";

export function normalizeShoppingName(name: string): string {
  return name.trim().toLowerCase();
}

export function readCheckedShoppingNames(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOPPING_CHECKED_NAMES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .map((x) => (typeof x === "string" ? normalizeShoppingName(x) : ""))
        .filter((x) => x.length > 0),
    );
  } catch {
    return new Set();
  }
}

export function writeCheckedShoppingNames(names: Set<string>): void {
  localStorage.setItem(SHOPPING_CHECKED_NAMES_KEY, JSON.stringify([...names]));
}
