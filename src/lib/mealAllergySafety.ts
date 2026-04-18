/**
 * Heuristische Prüfung für Onboarding-Startplan & Prompt-Bau (DE).
 * Kein Ersatz für medizinische Allergen-Labels – dient der Vermeidung offensichtlicher Treffer.
 */

const ALLERGY_PATTERNS: Record<string, RegExp> = {
  gluten:
    /(brot|brötchen|nudel|pasta|spaghetti|paniermehl|couscous|bulgur|lasagne|pizza|gnocchi|weizen|dinkel|rogge|gerste|wrap|mehl|baguette|toast|pizzateig|panko|semmel|lasagne)/i,
  lactose:
    /(milch|käse|joghurt|quark|sahne|butter|mozzarella|parmesan|frischkäse|griechisch|emmental|cheddar|ricotta|schmand|crème|crème fraîche)/i,
  nuts: /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|müsli|musliriegel)/i,
  soy: /(soja|soy|tofu|tempeh|edamame|sojasauce)/i,
  eggs: /(ei\b|eier|omelett|rührei|mayonnaise|mayo\b)/i,
};

const MEAT_FISH: RegExp =
  /(hackfleisch|hähnchen|pute|schwein|fleisch|wurst|schnitzel|schinken|steak|speck|salami|bacon|currywurst|bratwurst|frikadell)/i;

export function mealTextBlob(meal: { name: string; ingredients: { name: string }[] }): string {
  return `${meal.name} ${meal.ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
}

export function violatesAllergy(blob: string, allergyId: string): boolean {
  const re = ALLERGY_PATTERNS[allergyId];
  if (!re) return false;
  return re.test(blob);
}

export function violatesDietaryPreferences(blob: string, prefs: string[]): boolean {
  if (!prefs?.length) return false;
  if (prefs.includes("vegan")) {
    if (
      /(milch|käse|ei|eier|joghurt|quark|butter|sahne|honig|fleisch|hähnchen|lachs|fisch|thunfisch|wurst|hack|speck|schinken|schnitzel|schwein|pute)/i.test(
        blob,
      )
    ) {
      return true;
    }
  }
  if (prefs.includes("vegetarian") && !prefs.includes("vegan")) {
    if (MEAT_FISH.test(blob)) return true;
    if (/(lachs|thunfisch|fischfilet|garnelen|garnelen|lachsfilet|forelle|seelachs)/i.test(blob)) return true;
  }
  if (prefs.includes("pescatarian")) {
    if (/(hackfleisch|hähnchen|pute|schwein|wurst|schnitzel|schinken|steak|speck|salami|bacon|currywurst|bratwurst|frikadell)/i.test(blob)) {
      return true;
    }
  }
  return false;
}

export function isMealSafeForUser(
  meal: { name: string; ingredients: { name: string }[] },
  allergies: string[],
  dietaryPreferences: string[],
): boolean {
  const blob = mealTextBlob(meal);
  for (const a of allergies || []) {
    if (a === "none") continue;
    if (violatesAllergy(blob, a)) return false;
  }
  if (violatesDietaryPreferences(blob, dietaryPreferences || [])) return false;
  return true;
}

/** Für Supabase Edge Function / Prompts */
export function buildGermanConstraintPrompt(
  allergies: string[],
  dietaryPreferences: string[],
): string {
  const lines: string[] = [];
  const a = (allergies || []).filter((x) => x && x !== "none");
  const d = dietaryPreferences || [];

  if (a.length) {
    const map: Record<string, string> = {
      gluten: "Gluten / Weizen, Roggen, Gerste, Dinkel, Bulgur, normale Nudeln, Brot, Paniermehl",
      lactose: "Laktose / Milch, Käse, Joghurt, Quark, Sahne, Butter",
      nuts: "Nüsse und Mandeln (inkl. Nussmus, Mandelmilch wenn relevant)",
      soy: "Soja (Tofu, Sojasauce, Sojadrink)",
      eggs: "Eier und Eiprodukte",
    };
    lines.push(
      "STRIKTE ALLERGEN-REGELN (absolut einhalten):",
      ...a.map((id) => `- ${map[id] || id}: KEINE Zutaten und keine Gerichte, die dies enthalten könnten.`),
    );
  }

  if (d.includes("vegan")) {
    lines.push("Ernährung: vegan – keine tierischen Produkte (kein Fleisch, Fisch, Milch, Ei, Honig).");
  } else if (d.includes("vegetarian")) {
    lines.push("Ernährung: vegetarisch – kein Fleisch und kein Fisch.");
  } else if (d.includes("pescatarian")) {
    lines.push("Ernährung: pescetarisch – kein Fleisch von Landtieren; Fisch ist erlaubt.");
  }

  if (!lines.length) return "";
  return lines.join("\n");
}
