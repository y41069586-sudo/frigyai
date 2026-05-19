/**
 * Heuristische Prüfung für Onboarding-Startplan & Prompt-Bau (DE).
 * Kein Ersatz für medizinische Allergen-Labels – dient der Vermeidung offensichtlicher Treffer.
 */

const ALLERGY_PATTERNS: Record<string, RegExp> = {
  gluten:
    /(brot|brötchen|nudel|pasta|spaghetti|paniermehl|couscous|bulgur|lasagne|pizza|gnocchi|weizen|dinkel|rogge|gerste|wrap|mehl|baguette|toast|pizzateig|panko|semmel|lasagne)/i,
  wheat:
    /(brot|brötchen|nudel|pasta|spaghetti|paniermehl|couscous|bulgur|lasagne|pizza|gnocchi|weizen|dinkel|rogge|gerste|wrap|mehl|baguette|toast|pizzateig|panko|semmel|lasagne)/i,
  lactose:
    /(milch|käse|joghurt|quark|sahne|butter|mozzarella|parmesan|frischkäse|griechisch|emmental|cheddar|ricotta|schmand|crème|crème fraîche)/i,
  milk:
    /(milch|käse|joghurt|quark|sahne|butter|mozzarella|parmesan|frischkäse|griechisch|emmental|cheddar|ricotta|schmand|crème|crème fraîche)/i,
  nuts: /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|müsli|musliriegel)/i,
  peanuts: /(erdnuss|erdnüsse|peanut|peanuts|erdnussbutter|erdnussmus)/i,
  treeNuts: /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|nussmus|mandelmilch)/i,
  "tree-nuts": /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|nussmus|mandelmilch)/i,
  soy: /(soja|soy|tofu|tempeh|edamame|sojasauce)/i,
  eggs: /(ei\b|eier|omelett|rührei|mayonnaise|mayo\b)/i,
  egg: /(ei\b|eier|omelett|rührei|mayonnaise|mayo\b)/i,
  fish: /(fisch|lachs|thunfisch|forelle|seelachs|kabeljau|sardine|makrele)/i,
  shellfish: /(garnele|garnelen|shrimp|krabbe|krebs|hummer|muschel|auster|scampi)/i,
};

const MEAT_FISH: RegExp =
  /(hackfleisch|hähnchen|pute|schwein|fleisch|wurst|schnitzel|schinken|steak|speck|salami|bacon|currywurst|bratwurst|frikadell)/i;

const HIGH_CARB_FOODS: RegExp =
  /(nudel|pasta|spaghetti|brot|brötchen|reis|hafer|müsli|kartoffel|pommes|paniermehl|honig|baguette|toast|lasagne|bulgur|couscous|gnocchi|pizza)/i;

const PALEO_EXCLUDED: RegExp =
  /(nudel|pasta|spaghetti|brot|brötchen|reis|hafer|müsli|bohnen|linsen|kichererbsen|milch|käse|joghurt|quark|sahne|paniermehl|baguette)/i;

export type UserMealPlanProfile = {
  allergies: string[];
  allergiesOther: string;
  dietaryPreferences: string[];
  healthGoals: string[];
};

const DIET_STYLE_PROMPT: Record<string, string> = {
  balanced:
    "Ernährungsziel (Onboarding): Ausgewogene Ernährung – abwechslungsreiche, alltagstaugliche Mahlzeiten mit Gemüse, komplexen Kohlenhydraten, magerem Protein und gesunden Fetten.",
  keto:
    "Ernährungsziel (Onboarding): Keto – sehr kohlenhydratarm (deutlich unter 50 g KH/Tag), moderates Protein, hoher Fettanteil. KEINE Pasta, Brot, Reis, Kartoffeln, Müsli, Zucker, süße Snacks.",
  "low-carb":
    "Ernährungsziel (Onboarding): Kohlenhydratarm – reduzierte Kohlenhydrate in jeder Mahlzeit. Bevorzuge Gemüse, Protein, gesunde Fette; vermeide große Portionen Pasta, Brot, Reis, Kartoffeln, Müsli, Zucker.",
  paleo:
    "Ernährungsziel (Onboarding): Paleo – keine Getreide (Brot, Pasta, Müsli), keine Hülsenfrüchte, keine Milchprodukte, kein stark verarbeiteter Zucker; natürliche Lebensmittel (Fleisch/Fisch/Eier/Gemüse/Nüsse).",
};

const HEALTH_GOAL_PROMPT: Record<string, string> = {
  fitness:
    "Zusätzliches Ziel: Fitness & Straffung – proteinreich, mageres Protein in Hauptmahlzeiten.",
  performance:
    "Zusätzliches Ziel: Sportliche Leistung – ausreichend Energie und Kohlenhydrate für Leistung, gutes Protein für Regeneration.",
  "anti-inflammatory":
    "Zusätzliches Ziel: Entzündungshemmend – viel Gemüse, gesunde Fette (z. B. Olivenöl), Fisch wo passend; wenig stark verarbeitete und zuckerreiche Produkte.",
  energy:
    "Zusätzliches Ziel: Energie steigern – ausgewogene Mahlzeiten mit komplexen Kohlenhydraten, nicht zu schwer/fettig.",
  pregnancy:
    "Zusätzliches Ziel: Schwangerschaft – keine rohen Eier/Fleisch/Fisch, kein Alkohol; ausgewogene, sichere Hausmannskost.",
  digestion:
    "Zusätzliches Ziel: Verdauungsgesundheit – leicht verdaulich, ballaststoffreich wo passend, nicht übermäßig fettig.",
};

function parseStoredProfile(raw: string | null): Partial<UserMealPlanProfile> | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return {
      allergies: Array.isArray(p.allergies) ? p.allergies.filter((x: string) => x && x !== "none") : [],
      allergiesOther: typeof p.allergiesOther === "string" ? p.allergiesOther.trim() : "",
      dietaryPreferences: Array.isArray(p.dietaryPreferences)
        ? p.dietaryPreferences.filter((x: string) => x && x !== "none")
        : [],
      healthGoals: Array.isArray(p.healthGoals)
        ? p.healthGoals.filter((x: string) => x && x !== "none")
        : [],
    };
  } catch {
    return null;
  }
}

/** Liest Ernährungsvorgaben aus userProfile mit Fallback auf onboardingUserData. */
export function readUserMealPlanProfile(): UserMealPlanProfile {
  const profile = parseStoredProfile(
    typeof localStorage !== "undefined" ? localStorage.getItem("userProfile") : null,
  );
  const onboarding = parseStoredProfile(
    typeof localStorage !== "undefined" ? localStorage.getItem("onboardingUserData") : null,
  );

  const pick = <T,>(a: T[] | undefined, b: T[] | undefined): T[] =>
    (a?.length ? a : b) || [];

  return {
    allergies: pick(profile?.allergies, onboarding?.allergies),
    allergiesOther: profile?.allergiesOther || onboarding?.allergiesOther || "",
    dietaryPreferences: pick(profile?.dietaryPreferences, onboarding?.dietaryPreferences),
    healthGoals: pick(profile?.healthGoals, onboarding?.healthGoals),
  };
}

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
  if (prefs.includes("keto") || prefs.includes("low-carb")) {
    if (HIGH_CARB_FOODS.test(blob)) return true;
  }
  if (prefs.includes("paleo") && PALEO_EXCLUDED.test(blob)) {
    return true;
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

export function findMealSafetyViolations(
  meal: { name: string; ingredients: { name: string }[] },
  allergies: string[],
  dietaryPreferences: string[],
  allergiesOther = "",
): string[] {
  const blob = mealTextBlob(meal);
  const violations: string[] = [];

  for (const allergy of allergies || []) {
    if (!allergy || allergy === "none" || allergy === "other") continue;
    if (violatesAllergy(blob, allergy)) violations.push(allergy);
  }

  const custom = allergiesOther.trim().toLowerCase();
  if (custom) {
    const customTerms = custom
      .split(/[,;/\n]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3);
    if (customTerms.some((term) => blob.includes(term))) violations.push("other");
  }

  if (violatesDietaryPreferences(blob, dietaryPreferences || [])) violations.push("dietaryPreferences");
  return [...new Set(violations)];
}

/** Für Supabase Edge Function / Prompts */
export function buildGermanConstraintPrompt(
  allergies: string[],
  dietaryPreferences: string[],
  allergiesOther = "",
  healthGoals: string[] = [],
): string {
  const lines: string[] = [];
  const a = (allergies || []).filter((x) => x && x !== "none");
  const d = (dietaryPreferences || []).filter((x) => x && x !== "none");
  const goals = (healthGoals || []).filter((x) => x && x !== "none");

  if (a.length) {
    const map: Record<string, string> = {
      gluten: "Gluten / Weizen, Roggen, Gerste, Dinkel, Bulgur, normale Nudeln, Brot, Paniermehl",
      wheat: "Weizen / Glutenhaltiges Getreide, Brot, Nudeln, Mehl, Wraps, Paniermehl",
      lactose: "Laktose / Milch, Käse, Joghurt, Quark, Sahne, Butter",
      milk: "Milchprodukte / Milch, Käse, Joghurt, Quark, Sahne, Butter",
      nuts: "Nüsse und Mandeln (inkl. Nussmus, Mandelmilch wenn relevant)",
      peanuts: "Erdnüsse und Erdnussprodukte",
      treeNuts: "Baumnüsse / Mandeln, Haselnüsse, Walnüsse, Cashew, Pistazien usw.",
      "tree-nuts": "Baumnüsse / Mandeln, Haselnüsse, Walnüsse, Cashew, Pistazien usw.",
      soy: "Soja (Tofu, Sojasauce, Sojadrink)",
      eggs: "Eier und Eiprodukte",
      egg: "Eier und Eiprodukte",
      fish: "Fisch und Fischprodukte",
      shellfish: "Schalentiere / Garnelen, Krabben, Muscheln, Hummer",
    };
    lines.push(
      "STRIKTE ALLERGEN-REGELN (absolut einhalten):",
      ...a.map((id) => `- ${map[id] || id}: KEINE Zutaten und keine Gerichte, die dies enthalten könnten.`),
    );
  }

  const customAllergy = allergiesOther.trim();
  if (customAllergy) {
    lines.push(
      "Zusätzliche Nutzer-Unverträglichkeit / Allergie (absolut einhalten):",
      `- ${customAllergy}: KEINE Zutaten und keine Gerichte, die dies enthalten oder wahrscheinlich enthalten könnten.`,
    );
  }

  if (d.includes("vegan")) {
    lines.push("Ernährung: vegan – keine tierischen Produkte (kein Fleisch, Fisch, Milch, Ei, Honig).");
  } else if (d.includes("vegetarian")) {
    lines.push("Ernährung: vegetarisch – kein Fleisch und kein Fisch.");
  } else if (d.includes("pescatarian")) {
    lines.push("Ernährung: pescetarisch – kein Fleisch von Landtieren; Fisch ist erlaubt.");
  }

  for (const pref of d) {
    if (["vegan", "vegetarian", "pescatarian"].includes(pref)) continue;
    const line = DIET_STYLE_PROMPT[pref];
    if (line) lines.push(line);
  }

  if (goals.length) {
    lines.push("Weitere Ziele aus dem Onboarding (berücksichtigen):");
    for (const goal of goals) {
      const line = HEALTH_GOAL_PROMPT[goal];
      if (line) lines.push(`- ${line}`);
    }
  }

  if (!lines.length) return "";
  return lines.join("\n");
}
