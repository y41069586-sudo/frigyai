/**
 * Heuristische Prüfung für Onboarding-Startplan & Prompt-Bau.
 * Kein Ersatz für medizinische Allergen-Labels – dient der Vermeidung offensichtlicher Treffer.
 */

import type { Language } from "@/contexts/LanguageContext";

const EGG_BLOB_RX = /(\bei\b|\beier\b|\begg\b|\beggs\b|omelett|omelette|rührei|mayonnaise|\bmayo\b)/i;

const ALLERGY_DENY_TERMS: Record<string, string[]> = {
  gluten: ["semolina", "durum", "crouton", "croutons", "grieß", "spelt", "seitan", "caesar", "tempura", "udon", "ramen"],
  lactose: ["milch", "käse", "joghurt", "quark", "sahne", "butter", "lactose", "cream", "yogurt", "cheese"],
  milk: ["milch", "käse", "joghurt", "quark", "sahne", "butter", "cream", "yogurt", "cheese", "whey"],
  nuts: ["mandel", "haselnuss", "walnuss", "cashew", "pistaz", "nussmus", "almond"],
  treeNuts: ["mandel", "haselnuss", "walnuss", "cashew", "pistaz", "nussmus", "almond"],
  "tree-nuts": ["mandel", "haselnuss", "walnuss", "cashew", "pistaz", "nussmus"],
  peanuts: ["erdnuss", "peanut", "erdnussbutter", "erdnussmus"],
  soy: ["soja", "soy", "tofu", "tempeh", "edamame", "sojasauce", "miso"],
  eggs: ["ei", "eier", "egg", "eggs", "omelett", "omelette", "rührei", "mayonnaise", "mayo", "carbonara"],
  fish: ["fisch", "lachs", "thunfisch", "forelle", "fish", "salmon", "tuna"],
  shellfish: ["garnele", "garnelen", "shrimp", "krabbe", "krebs", "hummer", "muschel", "auster", "scampi"],
};

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
  fish: /(fisch|lachs|thunfisch|forelle|seelachs|kabeljau|sardine|makrele)/i,
  shellfish: /(garnele|garnelen|shrimp|krabbe|krebs|hummer|muschel|auster|scampi)/i,
};

const MEAT_FISH: RegExp =
  /(hackfleisch|hähnchen|pute|schwein|fleisch|wurst|schnitzel|schinken|steak|speck|salami|bacon|currywurst|bratwurst|frikadell)/i;

const HIGH_CARB_RX =
  /(\bnudeln?\b|\bpasta\b|\bspaghetti\b|\bbrot\b|\bbrötchen\b|\breis\b|\bhafer\b|\bmüsli\b|\bkartoffel\b|\bpommes\b|\bhonig\b|\bbaguette\b|\btoast\b|\blasagne\b|\bbulgur\b|\bcouscous\b|\bgnocchi\b|\bpizza\b|\bbread\b|\brice\b|\bpotato\b|\boats?\b)/i;

const KETO_SAFE_RX = /(blumenkohl\s*reis|cauliflower\s*rice|konjac|shirataki|gemüse\s*reis)/i;

const PALEO_EXCLUDED: RegExp =
  /(nudel|pasta|spaghetti|brot|brötchen|reis|hafer|müsli|bohnen|linsen|kichererbsen|milch|käse|joghurt|quark|sahne|paniermehl|baguette)/i;

const PLANT_MILK_PHRASES = [
  "pflanzenmilch",
  "hafermilch",
  "sojamilch",
  "reismilch",
  "kokosmilch",
  "cashewmilch",
  "oat milk",
  "soy milk",
  "almond milk",
  "rice milk",
  "plant milk",
] as const;

const TOFU_SCRAMBLE_MARKERS = [
  "tofu scramble",
  "tofu-scramble",
  "tofu rührei",
  "tofu-rührei",
  "tofu brouille",
] as const;

function scrubPlantMilksForDiet(blob: string): string {
  let out = blob;
  for (const phrase of PLANT_MILK_PHRASES) {
    out = out.replaceAll(phrase, " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

function isTofuScrambleDish(blob: string): boolean {
  if (TOFU_SCRAMBLE_MARKERS.some((m) => blob.includes(m))) return true;
  return /\btofu\b/.test(blob) && blob.includes("rührei");
}

function hasAnimalEggSignal(blob: string): boolean {
  if (isTofuScrambleDish(blob)) return false;
  return EGG_BLOB_RX.test(blob);
}

export type UserMealPlanProfile = {
  allergies: string[];
  allergiesOther: string;
  dietaryPreferences: string[];
  healthGoals: string[];
};

const DIET_STYLE_PROMPT: Record<Language, Record<string, string>> = {
  de: {
    balanced:
      "Ernährungsziel (Onboarding „Wie ist dein Ernährungsziel?“): Ausgewogene Ernährung – abwechslungsreiche, alltagstaugliche Mahlzeiten mit Gemüse, komplexen Kohlenhydraten, magerem Protein und gesunden Fetten.",
    vegan:
      "Ernährungsziel (Onboarding): Vegan – keine tierischen Produkte (kein Fleisch, Fisch, Milch, Ei, Honig).",
    vegetarian:
      "Ernährungsziel (Onboarding): Vegetarisch – kein Fleisch und kein Fisch.",
    keto:
      "Ernährungsziel (Onboarding): Keto – sehr kohlenhydratarm (deutlich unter 50 g KH/Tag), moderates Protein, hoher Fettanteil. KEINE Pasta, Brot, Reis, Kartoffeln, Müsli, Zucker, süße Snacks.",
    "low-carb":
      "Ernährungsziel (Onboarding): Kohlenhydratarm – reduzierte Kohlenhydrate in jeder Mahlzeit. Bevorzuge Gemüse, Protein, gesunde Fette; vermeide große Portionen Pasta, Brot, Reis, Kartoffeln, Müsli, Zucker.",
    paleo:
      "Ernährungsziel (Onboarding): Paleo – keine Getreide (Brot, Pasta, Müsli), keine Hülsenfrüchte, keine Milchprodukte, kein stark verarbeiteter Zucker; natürliche Lebensmittel (Fleisch/Fisch/Eier/Gemüse/Nüsse).",
  },
  en: {
    balanced:
      "Dietary goal (onboarding): Balanced nutrition – varied everyday meals with vegetables, complex carbs, lean protein, and healthy fats.",
    vegan:
      "Dietary goal (onboarding): Vegan – no animal products (no meat, fish, dairy, eggs, honey).",
    vegetarian:
      "Dietary goal (onboarding): Vegetarian – no meat or fish.",
    keto:
      "Dietary goal (onboarding): Keto – very low carb (well under 50 g carbs/day), moderate protein, higher fat. NO pasta, bread, rice, potatoes, cereal, sugar, sweet snacks.",
    "low-carb":
      "Dietary goal (onboarding): Low-carb – reduced carbs every meal. Prefer vegetables, protein, healthy fats; avoid large portions of pasta, bread, rice, potatoes, cereal, sugar.",
    paleo:
      "Dietary goal (onboarding): Paleo – no grains (bread, pasta, cereal), no legumes, no dairy, no heavily processed sugar; natural foods (meat/fish/eggs/vegetables/nuts).",
  },
  fr: {
    balanced:
      "Objectif alimentaire (onboarding): Alimentation équilibrée – repas variés du quotidien avec légumes, glucides complexes, protéines maigres et bonnes graisses.",
    vegan:
      "Objectif alimentaire (onboarding): Végan – aucun produit animal (pas de viande, poisson, lait, œufs, miel).",
    vegetarian:
      "Objectif alimentaire (onboarding): Végétarien – pas de viande ni de poisson.",
    keto:
      "Objectif alimentaire (onboarding): Cétogène – très faible en glucides (bien sous 50 g/j), protéines modérées, plus de lipides. PAS de pâtes, pain, riz, pommes de terre, céréales, sucre, snacks sucrés.",
    "low-carb":
      "Objectif alimentaire (onboarding): Faible en glucides – moins de glucides à chaque repas. Privilégier légumes, protéines, bonnes graisses; éviter grandes portions de pâtes, pain, riz, pommes de terre, céréales, sucre.",
    paleo:
      "Objectif alimentaire (onboarding): Paléo – pas de céréales (pain, pâtes), pas de légumineuses, pas de produits laitiers, pas de sucre très transformé; aliments naturels (viande/poisson/œufs/légumes/noix).",
  },
};

const HEALTH_GOAL_PROMPT: Record<Language, Record<string, string>> = {
  de: {
    fitness: "Zusätzliches Ziel: Fitness & Straffung – proteinreich, mageres Protein in Hauptmahlzeiten.",
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
  },
  en: {
    fitness: "Additional goal: Fitness – high protein, lean protein in main meals.",
    performance:
      "Additional goal: Athletic performance – enough energy and carbs for performance, good protein for recovery.",
    "anti-inflammatory":
      "Additional goal: Anti-inflammatory – plenty of vegetables, healthy fats (e.g. olive oil), fish where suitable; less processed and sugary foods.",
    energy: "Additional goal: More energy – balanced meals with complex carbs, not too heavy or greasy.",
    pregnancy:
      "Additional goal: Pregnancy – no raw eggs/meat/fish, no alcohol; balanced, safe everyday meals.",
    digestion:
      "Additional goal: Digestive health – easy to digest, fiber where appropriate, not overly fatty.",
  },
  fr: {
    fitness: "Objectif supplémentaire: Fitness – riche en protéines, protéines maigres aux repas principaux.",
    performance:
      "Objectif supplémentaire: Performance sportive – assez d'énergie et de glucides pour la performance, bonnes protéines pour la récupération.",
    "anti-inflammatory":
      "Objectif supplémentaire: Anti-inflammatoire – beaucoup de légumes, bonnes graisses (ex. huile d'olive), poisson si adapté; moins de produits transformés et sucrés.",
    energy:
      "Objectif supplémentaire: Plus d'énergie – repas équilibrés avec glucides complexes, pas trop lourds ou gras.",
    pregnancy:
      "Objectif supplémentaire: Grossesse – pas d'œufs/viande/poisson crus, pas d'alcool; cuisine saine et équilibrée.",
    digestion:
      "Objectif supplémentaire: Digestion – facile à digérer, fibres si pertinent, pas trop gras.",
  },
};

const CUISINE_GUIDANCE: Record<Language, Record<string, string>> = {
  de: {
    balanced:
      "Alltagsküche: Müsli, Porridge, Brot mit Aufstrich, Eier, Joghurt, Obst; Mittag/Abend: Nudeln, Reis, Kartoffeln, Fleisch/Fisch mit Gemüse, Pfannengerichte, Suppe.",
    vegan:
      "Alltagsküche (vegan): Tofu, Linsen, Kichererbsen, Gemüse-Pfannen, Salate mit Hülsenfrüchten, Vollkorn-Reis/Nudeln nur wenn zum Ziel passend, Nuss-Aufstriche, Obst, Hafer mit pflanzlicher Milch.",
    vegetarian:
      "Alltagsküche (vegetarisch): Eier, Käse, Joghurt, Gemüsepfannen, Linsensuppe, Pasta mit Gemüse, Salate, Kartoffeln, Vollkornbeilagen.",
    keto:
      "Alltagsküche (keto): Eier, Avocado, Salate mit Olivenöl, Fleisch/Fisch mit Gemüse, Gemüsepfannen, Nüsse, Käse – KEINE Pasta, Brot, Reis, Kartoffeln, Müsli, Zucker.",
    lowCarb:
      "Alltagsküche (kohlenhydratarm): Protein + Gemüse (Hähnchen-Salat, Lachs mit Brokkoli, Rührei mit Spinat), kleine Portionen Vollkorn nur sparsam – keine großen Pasta-/Brot-/Reis-Portionen.",
    paleo:
      "Alltagsküche (paleo): Fleisch/Fisch/Eier mit Gemüse, Salate, Nüsse, Süßkartoffeln in Maßen – KEIN Brot, Pasta, Müsli, Hülsenfrüchte, Milchprodukte.",
  },
  en: {
    balanced:
      "Everyday meals: oats, porridge, toast, eggs, yogurt, fruit; lunch/dinner: pasta, rice, potatoes, meat/fish with vegetables, stir-fries, soup.",
    vegan:
      "Everyday vegan meals: tofu, lentils, chickpeas, veggie stir-fries, legume salads, plant milk oats, nut butters, fruit – no animal products.",
    vegetarian:
      "Everyday vegetarian meals: eggs, cheese, yogurt, veggie pans, lentil soup, pasta with vegetables, salads, potatoes.",
    keto:
      "Everyday keto meals: eggs, avocado, salads with olive oil, meat/fish with vegetables, cheese, nuts – NO pasta, bread, rice, potatoes, cereal, sugar.",
    lowCarb:
      "Everyday low-carb meals: protein + vegetables (chicken salad, salmon and broccoli, eggs with spinach) – avoid large pasta/bread/rice portions.",
    paleo:
      "Everyday paleo meals: meat/fish/eggs with vegetables, salads, nuts – NO bread, pasta, cereal, legumes, dairy.",
  },
  fr: {
    balanced:
      "Repas du quotidien: flocons, porridge, pain, œufs, yaourt, fruits; déjeuner/dîner: pâtes, riz, pommes de terre, viande/poisson avec légumes.",
    vegan:
      "Repas végan: tofu, lentilles, pois chiches, poêlées de légumes, salades aux légumineuses, lait végétal – aucun produit animal.",
    vegetarian:
      "Repas végétariens: œufs, fromage, yaourt, légumes, soupe de lentilles, pâtes aux légumes, salades.",
    keto:
      "Repas cétogènes: œufs, avocat, salades, viande/poisson avec légumes, fromage, noix – PAS de pâtes, pain, riz, pommes de terre, céréales, sucre.",
    lowCarb:
      "Repas faibles en glucides: protéines + légumes – éviter grandes portions de pâtes/pain/riz.",
    paleo:
      "Repas paléo: viande/poisson/œufs avec légumes, salades, noix – PAS de pain, pâtes, céréales, légumineuses, produits laitiers.",
  },
};

/** Küchen-Leitlinie für den KI-System-Prompt (widerspricht nicht dem Ernährungsziel). */
export function getDietaryCuisineGuidance(
  dietaryPreferences: string[],
  language: Language = "de",
): string {
  const d = (dietaryPreferences || []).filter((x) => x && x !== "none");
  const L = CUISINE_GUIDANCE[language] ?? CUISINE_GUIDANCE.de;
  if (d.includes("keto")) return L.keto;
  if (d.includes("low-carb")) return L.lowCarb;
  if (d.includes("paleo")) return L.paleo;
  if (d.includes("vegan")) return L.vegan;
  if (d.includes("vegetarian")) return L.vegetarian;
  return L.balanced;
}

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
  const joined = `${meal.name} ${meal.ingredients.map((i) => i.name).join(" ")}`;
  return joined.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function blobContainsDenyTerm(blob: string, term: string): boolean {
  const t = term.toLowerCase().trim();
  if (!t) return false;
  if (t.length <= 3) return blob.split(/\s+/).includes(t);
  return blob.includes(t);
}

function denyTermsHit(allergyId: string, blob: string): boolean {
  const id = allergyId === "egg" ? "eggs" : allergyId;
  const terms = ALLERGY_DENY_TERMS[id];
  if (!terms) return false;
  return terms.some((term) => blobContainsDenyTerm(blob, term));
}

function hasEgg(blob: string): boolean {
  return EGG_BLOB_RX.test(blob);
}

export function violatesAllergy(blob: string, allergyId: string): boolean {
  const id = allergyId === "egg" ? "eggs" : allergyId;
  if (id === "eggs") return hasEgg(blob);
  if (denyTermsHit(id, blob)) return true;
  const re = ALLERGY_PATTERNS[id];
  if (!re) return false;
  return re.test(blob);
}

export function violatesDietaryPreferences(blob: string, prefs: string[]): string[] {
  if (!prefs?.length) return [];
  const hit: string[] = [];
  const dietBlob = scrubPlantMilksForDiet(blob);
  if (prefs.includes("vegan")) {
    if (
      /(\bkäse\b|\beier\b|\bjoghurt\b|\bquark\b|\bbutter\b|\bsahne\b|\bhonig\b|\bfleisch\b|\bhähnchen\b|\blachs\b|\bfisch\b|\bthunfisch\b|\bwurst\b|\bhack\b|\bspeck\b|\bschinken\b|\bschnitzel\b|\bschwein\b|\bpute\b|\bmilch\b)/i.test(
        dietBlob,
      ) ||
      hasAnimalEggSignal(dietBlob)
    ) {
      hit.push("vegan");
    }
  }
  if (prefs.includes("vegetarian") && !prefs.includes("vegan")) {
    if (MEAT_FISH.test(dietBlob)) hit.push("vegetarian");
    else if (/(lachs|thunfisch|fischfilet|garnelen|lachsfilet|forelle|seelachs)/i.test(dietBlob)) hit.push("vegetarian");
  }
  if (prefs.includes("pescatarian")) {
    if (/(hackfleisch|hähnchen|pute|schwein|wurst|schnitzel|schinken|steak|speck|salami|bacon|currywurst|bratwurst|frikadell)/i.test(dietBlob)) {
      hit.push("pescatarian");
    }
  }
  if (prefs.includes("keto") || prefs.includes("low-carb")) {
    const scrubbed = dietBlob.replace(KETO_SAFE_RX, " ");
    if (HIGH_CARB_RX.test(scrubbed)) hit.push("low-carb");
  }
  if (prefs.includes("paleo") && PALEO_EXCLUDED.test(dietBlob)) hit.push("paleo");
  return [...new Set(hit)];
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
  if (violatesDietaryPreferences(blob, dietaryPreferences || []).length) return false;
  return true;
}

export type MealSafetyReasons = { allergy: string[]; diet: string[] };

export function mealSafetyReasons(
  meal: { name: string; ingredients: { name: string }[] },
  allergies: string[],
  dietaryPreferences: string[],
  allergiesOther = "",
): MealSafetyReasons {
  const blob = mealTextBlob(meal);
  const allergy: string[] = [];

  for (const allergyId of allergies || []) {
    if (!allergyId || allergyId === "none" || allergyId === "other") continue;
    if (violatesAllergy(blob, allergyId)) allergy.push(allergyId === "egg" ? "eggs" : allergyId);
  }

  const custom = allergiesOther.trim().toLowerCase();
  if (custom) {
    const customTerms = custom
      .split(/[,;/\n]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3);
    for (const term of customTerms) {
      if (blobContainsDenyTerm(blob, term)) allergy.push(`other:${term}`);
    }
  }

  return {
    allergy: [...new Set(allergy)],
    diet: violatesDietaryPreferences(blob, dietaryPreferences || []),
  };
}

/** Flat list for logs/UI — e.g. `allergy:gluten`, `diet:vegan`. */
export function findMealSafetyViolations(
  meal: { name: string; ingredients: { name: string }[] },
  allergies: string[],
  dietaryPreferences: string[],
  allergiesOther = "",
): string[] {
  const r = mealSafetyReasons(meal, allergies, dietaryPreferences, allergiesOther);
  return [
    ...r.allergy.map((a) => `allergy:${a}`),
    ...r.diet.map((d) => `diet:${d}`),
  ];
}

const ALLERGY_LABELS: Record<Language, Record<string, string>> = {
  de: {
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
  },
  en: {
    gluten: "Gluten / wheat, rye, barley, spelt, bulgur, regular pasta, bread, breadcrumbs",
    wheat: "Wheat / gluten grains, bread, pasta, flour, wraps, breadcrumbs",
    lactose: "Lactose / milk, cheese, yogurt, quark, cream, butter",
    milk: "Dairy / milk, cheese, yogurt, quark, cream, butter",
    nuts: "Nuts and almonds (including nut butter, almond milk if relevant)",
    peanuts: "Peanuts and peanut products",
    treeNuts: "Tree nuts / almonds, hazelnuts, walnuts, cashew, pistachios, etc.",
    "tree-nuts": "Tree nuts / almonds, hazelnuts, walnuts, cashew, pistachios, etc.",
    soy: "Soy (tofu, soy sauce, soy drink)",
    eggs: "Eggs and egg products",
    egg: "Eggs and egg products",
    fish: "Fish and fish products",
    shellfish: "Shellfish / shrimp, crab, mussels, lobster",
  },
  fr: {
    gluten: "Gluten / blé, seigle, orge, épeautre, pâtes, pain, chapelure",
    wheat: "Blé / céréales avec gluten, pain, pâtes, farine, wraps",
    lactose: "Lactose / lait, fromage, yaourt, crème, beurre",
    milk: "Produits laitiers / lait, fromage, yaourt, crème, beurre",
    nuts: "Noix et amandes (beurre de noix, lait d'amande si pertinent)",
    peanuts: "Arachides et produits à base d'arachides",
    treeNuts: "Fruits à coque / amandes, noisettes, noix, cajou, pistaches",
    "tree-nuts": "Fruits à coque / amandes, noisettes, noix, cajou, pistaches",
    soy: "Soja (tofu, sauce soja, boisson soja)",
    eggs: "Œufs et produits à base d'œufs",
    egg: "Œufs et produits à base d'œufs",
    fish: "Poisson et produits à base de poisson",
    shellfish: "Crustacés / crevettes, crabe, moules, homard",
  },
};

/** Für Supabase Edge Function / Prompts */
export function buildConstraintPrompt(
  allergies: string[],
  dietaryPreferences: string[],
  allergiesOther = "",
  healthGoals: string[] = [],
  language: Language = "de",
): string {
  const lines: string[] = [];
  const lang = language === "en" || language === "fr" ? language : "de";
  const a = (allergies || []).filter((x) => x && x !== "none");
  const d = (dietaryPreferences || []).filter((x) => x && x !== "none");
  const goals = (healthGoals || []).filter((x) => x && x !== "none");
  const allergyMap = ALLERGY_LABELS[lang];
  const dietPrompts = DIET_STYLE_PROMPT[lang];
  const goalPrompts = HEALTH_GOAL_PROMPT[lang];

  if (a.length) {
    const header =
      lang === "en"
        ? "STRICT ALLERGEN RULES (must follow):"
        : lang === "fr"
          ? "RÈGLES ALLERGÈNES STRICTES (à respecter absolument):"
          : "STRIKTE ALLERGEN-REGELN (absolut einhalten):";
    const forbid =
      lang === "en"
        ? "NO ingredients or dishes that may contain this."
        : lang === "fr"
          ? "AUCUN ingrédient ni plat pouvant en contenir."
          : "KEINE Zutaten und keine Gerichte, die dies enthalten könnten.";
    lines.push(header, ...a.map((id) => `- ${allergyMap[id] || id}: ${forbid}`));
  }

  const customAllergy = allergiesOther.trim();
  if (customAllergy) {
    lines.push(
      lang === "en"
        ? `Additional user intolerance/allergy (must follow):\n- ${customAllergy}: NO matching ingredients or dishes.`
        : lang === "fr"
          ? `Intolérance/allergie supplémentaire (obligatoire):\n- ${customAllergy}: AUCUN ingrédient ni plat correspondant.`
          : `Zusätzliche Nutzer-Unverträglichkeit / Allergie (absolut einhalten):\n- ${customAllergy}: KEINE Zutaten und keine Gerichte, die dies enthalten oder wahrscheinlich enthalten könnten.`,
    );
  }

  for (const pref of d) {
    const line = dietPrompts[pref];
    if (line) lines.push(line);
  }
  if (d.length) {
    lines.push(getDietaryCuisineGuidance(d, lang));
  }

  if (goals.length) {
    const header =
      lang === "en"
        ? "Additional onboarding goals (consider):"
        : lang === "fr"
          ? "Autres objectifs onboarding (à prendre en compte):"
          : "Weitere Ziele aus dem Onboarding (berücksichtigen):";
    lines.push(header);
    for (const goal of goals) {
      const line = goalPrompts[goal];
      if (line) lines.push(`- ${line}`);
    }
  }

  if (!lines.length) return "";
  return lines.join("\n");
}

/** @deprecated Use buildConstraintPrompt */
export function buildGermanConstraintPrompt(
  allergies: string[],
  dietaryPreferences: string[],
  allergiesOther = "",
  healthGoals: string[] = [],
): string {
  return buildConstraintPrompt(allergies, dietaryPreferences, allergiesOther, healthGoals, "de");
}
