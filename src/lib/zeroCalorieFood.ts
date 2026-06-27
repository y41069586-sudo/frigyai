/** Drinks and foods with ~0 kcal that must still be loggable via camera/search. */
const ZERO_CALORIE_NAME_RX =
  /\b(wasserflasche|trinkwasser|mineralwasser|stilles\s*wasser|wasser|water|sprudel|sodawasser|tonic\s*water|tee\b|kräutertee|grüner\s*tee|schwarzer\s*tee|kaffee\s*schwarz|espresso\s*pur|diet\s*cola|zero\s*cola|light\s*cola|cola\s*zero|pepsi\s*max|sprite\s*zero)\b/i;

export function isZeroCalorieFoodName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  return ZERO_CALORIE_NAME_RX.test(name.trim());
}

export function zeroCalorieFoodEstimate(name: string) {
  const label = name.trim() || "Wasser";
  return {
    found: true,
    name: /\b(wasser|water|mineralwasser|trinkwasser|sprudel)\b/i.test(label) ? "Wasser" : label,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: "1 Glas",
    source: "ai" as const,
  };
}
