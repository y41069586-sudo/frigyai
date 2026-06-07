export type ShoppingListEntry = {
  name: string;
  amount: string;
  price: number;
};

const UNIT_ONLY =
  /^(g|kg|mg|ml|l|cl|dl|el|tl|stück|st\.?|portion|port\.?|kcal|cal|min|mins?|minuten|std\.?|x)$/i;

const AMOUNT_ONLY =
  /^[\d.,]+\s*(g|kg|mg|ml|l|cl|dl|kcal|cal|%|°c|°f|x)?$/i;

const COMBINED_LINE =
  /^([\d.,]+\s*(?:g|kg|mg|ml|l|cl|dl|EL|TL|Stück|St\.?|Portion|Port\.?|x)?)\s+(.+)$/i;

/** Names that should never appear as a shopping-list item on their own. */
export function isInvalidShoppingItemName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  if (/^[\d.,]+$/.test(t)) return true;
  if (AMOUNT_ONLY.test(t)) return true;
  if (UNIT_ONLY.test(t)) return true;
  if (t.length <= 2 && /^[\d.,]/.test(t)) return true;
  return false;
}

export function parseCombinedIngredientLine(raw: string): { name: string; amount: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(COMBINED_LINE);
  if (match) {
    return { amount: match[1].trim(), name: match[2].trim() };
  }
  return { name: trimmed, amount: "—" };
}
