/** Canonical German labels for common fridge items (vision + matching). */
const CANONICAL_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(freiland|bio|frische?)?\s*-?\s*(eier|ei\b|eggs?)\b/i, label: "Eier" },
  { pattern: /\b(voll|magere?|hafer|soja|mandel|kokos|laktosefreie?)?\s*-?\s*milch\b/i, label: "Milch" },
  { pattern: /\b(butter|margarine)\b/i, label: "Butter" },
  { pattern: /\b(natur|griechischer?|frischkäse|quark|joghurt|skyr)\b/i, label: "Joghurt" },
  { pattern: /\b(tomaten?|cherrytomaten)\b/i, label: "Tomaten" },
  { pattern: /\b(gurke|gurken)\b/i, label: "Gurke" },
  { pattern: /\b(zwiebeln?|zwiebel)\b/i, label: "Zwiebel" },
  { pattern: /\b(kartoffeln?|kartoffel)\b/i, label: "Kartoffeln" },
  { pattern: /\b(paprika|peperoni)\b/i, label: "Paprika" },
  { pattern: /\b(käse|mozzarella|gouda|cheddar|parmesan|feta)\b/i, label: "Käse" },
  { pattern: /\b(hähnchen|huhn|puten|hähnchenbrust)\b/i, label: "Hähnchen" },
  { pattern: /\b(rind|rinderhack|hackfleisch|gehacktes)\b/i, label: "Hackfleisch" },
  { pattern: /\b(brot|brötchen|toast|baguette)\b/i, label: "Brot" },
  { pattern: /\b(reis|basmati|jasminreis)\b/i, label: "Reis" },
  { pattern: /\b(nudeln?|pasta|spaghetti|penne)\b/i, label: "Nudeln" },
  { pattern: /\b(äpfel?|apfel)\b/i, label: "Äpfel" },
  { pattern: /\b(bananen?|banane)\b/i, label: "Bananen" },
  { pattern: /\b(salat|kopfsalat|rucola|rucola)\b/i, label: "Salat" },
  { pattern: /\b(möhren?|karotten?|mohren)\b/i, label: "Möhren" },
  { pattern: /\b(pilze|champignons?)\b/i, label: "Champignons" },
  { pattern: /\b(wasserflasche|trinkwasser|mineralwasser|stilles\s*wasser|wasser|water|sprudel)\b/i, label: "Wasser" },
  { pattern: /\b(saft|orangensaft|apfelsaft)\b/i, label: "Saft" },
];

export function canonicalizeIngredientLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const { pattern, label } of CANONICAL_RULES) {
    if (pattern.test(lower) || pattern.test(trimmed)) return label;
  }
  if (trimmed.length <= 1) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function dedupeIngredientLabels(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const label = canonicalizeIngredientLabel(raw);
    const key = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}
