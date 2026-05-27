import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_ATTEMPTS = [
  { name: "primary", maxTokens: 9000, maxIngredients: 5 },
  { name: "fallback", maxTokens: 7600, maxIngredients: 4 },
  { name: "compact", maxTokens: 6200, maxIngredients: 3 },
] as const;
type SupportedLanguage = "de" | "en" | "fr";

const LANGUAGE_CONFIG: Record<
  SupportedLanguage,
  {
    outputLabel: string;
    expertLabel: string;
    dayNames: string[];
    dayFallback: string;
    mealFallback: string;
  }
> = {
  de: {
    outputLabel: "Deutsch",
    expertLabel: "deutscher",
    dayNames: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    dayFallback: "Tag",
    mealFallback: "Mahlzeit",
  },
  en: {
    outputLabel: "English",
    expertLabel: "English-speaking",
    dayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    dayFallback: "Day",
    mealFallback: "Meal",
  },
  fr: {
    outputLabel: "francais",
    expertLabel: "francophone",
    dayNames: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    dayFallback: "Jour",
    mealFallback: "Repas",
  },
};

function resolveSupportedLanguage(raw: unknown): SupportedLanguage {
  return raw === "en" || raw === "fr" ? raw : "de";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeIngredientKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLERGY_PATTERNS: Record<string, RegExp> = {
  gluten: /(brot|brötchen|bread|pain|nudel|pasta|spaghetti|paniermehl|breadcrumbs|couscous|bulgur|lasagne|pizza|gnocchi|weizen|wheat|farine|dinkel|rogge|rye|gerste|barley|wrap|mehl|flour|baguette|toast|pizzateig|panko|semmel)/i,
  wheat: /(brot|brötchen|bread|pain|nudel|pasta|spaghetti|paniermehl|breadcrumbs|couscous|bulgur|lasagne|pizza|gnocchi|weizen|wheat|farine|dinkel|rogge|rye|gerste|barley|wrap|mehl|flour|baguette|toast|pizzateig|panko|semmel)/i,
  lactose: /(milch|milk|lait|käse|cheese|fromage|joghurt|yogurt|yaourt|quark|sahne|cream|creme|crème|butter|beurre|mozzarella|parmesan|frischkäse|cream cheese|griechisch|greek|emmental|cheddar|ricotta|schmand|crème fraîche)/i,
  milk: /(milch|milk|lait|käse|cheese|fromage|joghurt|yogurt|yaourt|quark|sahne|cream|creme|crème|butter|beurre|mozzarella|parmesan|frischkäse|cream cheese|griechisch|greek|emmental|cheddar|ricotta|schmand|crème fraîche)/i,
  nuts: /(nuss|nüsse|nuts|noix|mandel|almond|amande|haselnuss|hazelnut|walnuss|walnut|cashew|pistaz|pistach|paranuss|brazil nut|macadam|pekannuss|pecan|müsli|musliriegel)/i,
  peanuts: /(erdnuss|erdnüsse|peanut|peanuts|cacahuete|cacahuète|erdnussbutter|erdnussmus)/i,
  treeNuts: /(nuss|nüsse|nuts|noix|mandel|almond|amande|haselnuss|hazelnut|walnuss|walnut|cashew|pistaz|pistach|paranuss|brazil nut|macadam|pekannuss|pecan|nussmus|mandelmilch|almond milk|lait d amande|lait d'amande)/i,
  "tree-nuts": /(nuss|nüsse|nuts|noix|mandel|almond|amande|haselnuss|hazelnut|walnuss|walnut|cashew|pistaz|pistach|paranuss|brazil nut|macadam|pekannuss|pecan|nussmus|mandelmilch|almond milk|lait d amande|lait d'amande)/i,
  soy: /(soja|soy|soja sauce|tofu|tempeh|edamame|sojasauce|sauce soja)/i,
  eggs: /(ei\b|eier|egg|eggs|oeuf|oeufs|omelett|omelette|rührei|scrambled egg|mayonnaise|mayo\b)/i,
  egg: /(ei\b|eier|egg|eggs|oeuf|oeufs|omelett|omelette|rührei|scrambled egg|mayonnaise|mayo\b)/i,
  fish: /(fisch|fish|poisson|lachs|salmon|saumon|thunfisch|tuna|thon|forelle|trout|truite|seelachs|kabeljau|cod|cabillaud|sardine|makrele|mackerel|maquereau)/i,
  shellfish: /(garnele|garnelen|shrimp|crevette|krabbe|crab|crabe|krebs|lobster|hummer|homard|muschel|mussel|moule|auster|oyster|huître|scampi)/i,
};

function mealTextBlob(meal: any): string {
  return `${meal?.name ?? ""} ${(meal?.ingredients ?? []).map((i: any) => i?.name ?? "").join(" ")}`.toLowerCase();
}

function findSafetyViolations(mealPlan: any[], allergies: string[], dietaryPreferences: string[], allergiesOther: string) {
  const unsafe: string[] = [];
  const customTerms = String(allergiesOther || "")
    .toLowerCase()
    .split(/[,;/\n]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);

  for (const day of mealPlan || []) {
    for (const meal of day.meals || []) {
      const blob = mealTextBlob(meal);
      const violations: string[] = [];
      for (const allergy of allergies || []) {
        if (!allergy || allergy === "none" || allergy === "other") continue;
        if (ALLERGY_PATTERNS[allergy]?.test(blob)) violations.push(allergy);
      }
      if (customTerms.some((term) => blob.includes(term))) violations.push("other");
      if (dietaryPreferences?.includes("vegan") && /(milch|milk|lait|käse|cheese|fromage|ei\b|eier|egg|eggs|oeuf|oeufs|joghurt|yogurt|yaourt|quark|butter|beurre|sahne|cream|crème|honig|honey|miel|fleisch|meat|viande|hähnchen|chicken|poulet|lachs|salmon|saumon|fisch|fish|poisson|thunfisch|tuna|thon|wurst|sausage|hack|speck|bacon|schinken|ham|jambon|schnitzel|schwein|pork|porc|pute|turkey|dinde)/i.test(blob)) violations.push("vegan");
      if (dietaryPreferences?.includes("vegetarian") && /(hackfleisch|ground beef|boeuf hache|bœuf haché|hähnchen|chicken|poulet|pute|turkey|dinde|schwein|pork|porc|fleisch|meat|viande|wurst|sausage|saucisse|schnitzel|schinken|ham|jambon|steak|speck|bacon|salami|currywurst|bratwurst|frikadell|lachs|salmon|saumon|thunfisch|tuna|thon|fisch|fish|poisson)/i.test(blob)) violations.push("vegetarian");
      const highCarb = /(nudel|pasta|spaghetti|brot|brötchen|bread|pain|reis|rice|riz|hafer|oats|avoine|müsli|muesli|kartoffel|potato|pomme de terre|pommes|fries|frites|paniermehl|breadcrumbs|honig|honey|miel|baguette|lasagne|couscous|bulgur|gnocchi)/i;
      if ((dietaryPreferences?.includes("keto") || dietaryPreferences?.includes("low-carb")) && highCarb.test(blob)) {
        violations.push("low-carb");
      }
      if (dietaryPreferences?.includes("paleo") && /(nudel|pasta|spaghetti|brot|bread|pain|reis|rice|riz|hafer|oats|avoine|müsli|muesli|bohnen|beans|haricots|linsen|lentils|lentilles|milch|milk|lait|käse|cheese|fromage|joghurt|yogurt|yaourt|quark|sahne|cream|crème|paniermehl|breadcrumbs)/i.test(blob)) {
        violations.push("paleo");
      }
      if (violations.length) unsafe.push(`${day.day}: ${meal.name} (${[...new Set(violations)].join(", ")})`);
    }
  }
  return unsafe;
}

function stemToken(token: string): string {
  return token
    .replace(/(chen|lein)$/i, "")
    .replace(/(en|er|e|n|s)$/i, "")
    .trim();
}

function tokenizeIngredient(name: string): string[] {
  return normalizeIngredientKey(name)
    .split(" ")
    .map((t) => stemToken(t))
    .filter((t) => t.length >= 3);
}

function fridgeCoversIngredient(ingredientName: string, fridge: string[]): boolean {
  const n = normalizeIngredientKey(ingredientName);
  const nt = tokenizeIngredient(ingredientName);
  if (!n) return false;
  for (const raw of fridge) {
    const f = normalizeIngredientKey(raw);
    const ft = tokenizeIngredient(raw);
    if (!f) continue;
    if (n === f) return true;
    if (n.includes(f) || f.includes(n)) return true;
    if (ft.some((t) => nt.includes(t))) return true;
  }
  return false;
}

function generateGapShoppingList(mealPlan: any[], fridgeIngredients: string[]) {
  const map = new Map<string, { name: string; amounts: string[]; price: number }>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;

        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;

        const price = typeof ing.price === "number" ? ing.price : Number(ing.price) || 0;
        const amount = String(ing.amount || "").trim() || "—";

        if (map.has(key)) {
          const ex = map.get(key)!;
          ex.amounts.push(amount);
          ex.price += price;
        } else {
          map.set(key, {
            name: String(ing.name).trim(),
            amounts: [amount],
            price,
          });
        }
      }
    }
  }

  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: [...new Set(v.amounts)].join(" · "),
    price: Math.round(v.price * 100) / 100,
  }));
}

function computeScanMeta(mealPlan: any[], fridgeIngredients: string[], gapList: any[]) {
  const uniqueRecipe = new Set<string>();
  const covered = new Set<string>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;
        uniqueRecipe.add(key);
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) covered.add(key);
      }
    }
  }

  const percentHave =
    uniqueRecipe.size === 0 ? 0 : Math.round((covered.size / uniqueRecipe.size) * 100);

  let saved = 0;
  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        if (!fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;
        const p = typeof ing.price === "number" ? ing.price : Number(ing.price) || 0;
        saved += p;
      }
    }
  }

  const gapTotal = gapList.reduce((s: number, g: any) => s + (g.price || 0), 0);
  const allTotal = saved + gapTotal;
  const eurosSaved = allTotal > 0 ? Math.round(saved * 10) / 10 : 0;

  return { percentIngredientsFromFridge: percentHave, estimatedEurosSaved: eurosSaved };
}

const MACRO_KCAL_TOLERANCE = 50;

function macroKcal(p: number, c: number, f: number) {
  return p * 4 + c * 4 + f * 9;
}

function sumMeals(meals: any[]) {
  return meals.reduce(
    (a: any, m: any) => ({
      calories: a.calories + (Number(m.calories) || 0),
      protein: a.protein + (Number(m.protein) || 0),
      carbs: a.carbs + (Number(m.carbs) || 0),
      fat: a.fat + (Number(m.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function normalizeMeal(m: any) {
  const protein = Math.max(0, Math.round(Number(m.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(m.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(m.fat) || 0));
  const fromMacros = macroKcal(protein, carbs, fat);
  const stated = Number(m.calories) || 0;
  const calories =
    stated > 0 && Math.abs(stated - fromMacros) <= MACRO_KCAL_TOLERANCE
      ? Math.round(stated)
      : Math.max(50, Math.round(fromMacros));

  const ingredients = Array.isArray(m?.ingredients)
    ? m.ingredients
        .filter((ing: any) => ing && typeof ing === "object" && ing.name)
        .map((ing: any) => ({
          name: String(ing.name).trim(),
          amount: String(ing.amount || "1 Portion").trim(),
          price: Math.max(0, Math.round((Number(ing.price) || 0) * 100) / 100),
        }))
    : [];

  const instructions = Array.isArray(m?.instructions)
    ? m.instructions.map((step: any) => String(step).trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    ...m,
    type: String(m?.type || "Mahlzeit").trim(),
    name: String(m?.name || "Gericht").trim(),
    prepTime: Math.max(5, Math.round(Number(m?.prepTime) || 20)),
    ingredients,
    instructions,
    protein,
    carbs,
    fat,
    calories,
  };
}

function harmonizeDailyTargets(targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  return {
    ...targets,
    dailyCalories: macroKcal(targets.dailyProtein, targets.dailyCarbs, targets.dailyFat),
  };
}

function recalcMeal(m: any) {
  const protein = Math.max(0, Math.round(Number(m.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(m.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(m.fat) || 0));
  return { ...m, protein, carbs, fat, calories: Math.max(50, Math.round(macroKcal(protein, carbs, fat))) };
}

function balanceDayMacro(meals: any[], macro: "protein" | "carbs" | "fat", target: number) {
  for (let pass = 0; pass < 1200; pass++) {
    const totals = sumMeals(meals);
    const current = Number(totals[macro]) || 0;
    const diff = target - current;
    if (diff === 0) break;

    const idx = pass % meals.length;
    const meal = meals[idx];
    const currentValue = Number(meal[macro]) || 0;
    if (diff > 0) {
      meal[macro] = currentValue + 1;
    } else if (currentValue > 0) {
      meal[macro] = currentValue - 1;
    } else {
      continue;
    }
    meals[idx] = recalcMeal(meal);
  }
}

function validateSyncedDay(meals: any[], targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  const totals = sumMeals(meals);
  const expectedCalories = macroKcal(
    targets.dailyProtein,
    targets.dailyCarbs,
    targets.dailyFat,
  );

  if (
    totals.protein !== targets.dailyProtein ||
    totals.carbs !== targets.dailyCarbs ||
    totals.fat !== targets.dailyFat ||
    totals.calories !== expectedCalories
  ) {
    throw new Error("Meal plan macros out of sync");
  }

  for (const meal of meals) {
    const expectedMealCalories = macroKcal(
      Number(meal.protein) || 0,
      Number(meal.carbs) || 0,
      Number(meal.fat) || 0,
    );
    if ((Number(meal.calories) || 0) !== expectedMealCalories) {
      throw new Error("Meal calories do not match macros");
    }
  }
}

function syncDayToTargets(day: any, rawTargets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  const targets = harmonizeDailyTargets(rawTargets);
  let meals = (day.meals || []).map((m: any) => recalcMeal(normalizeMeal(m)));
  if (!meals.length) return day;

  const initial = sumMeals(meals);
  const fp = targets.dailyProtein / (initial.protein || 1);
  const fcb = targets.dailyCarbs / (initial.carbs || 1);
  const ff = targets.dailyFat / (initial.fat || 1);

  meals = meals.map((m: any) =>
    recalcMeal({
      ...m,
      protein: Math.max(0, Math.round((m.protein || 0) * fp)),
      carbs: Math.max(0, Math.round((m.carbs || 0) * fcb)),
      fat: Math.max(0, Math.round((m.fat || 0) * ff)),
    }),
  );

  const lastIdx = meals.length - 1;
  const beforeLast = sumMeals(meals.slice(0, lastIdx));
  meals[lastIdx] = recalcMeal({
    ...meals[lastIdx],
    protein: Math.max(0, targets.dailyProtein - beforeLast.protein),
    carbs: Math.max(0, targets.dailyCarbs - beforeLast.carbs),
    fat: Math.max(0, targets.dailyFat - beforeLast.fat),
  });

  balanceDayMacro(meals, "protein", targets.dailyProtein);
  balanceDayMacro(meals, "carbs", targets.dailyCarbs);
  balanceDayMacro(meals, "fat", targets.dailyFat);
  validateSyncedDay(meals, targets);
  return { ...day, meals };
}

function syncMealPlanToTargets(mealPlan: any[], targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  return mealPlan.map((day) => syncDayToTargets(day, targets));
}

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split("T")[0];
};

function validateMealPlanShape(mealPlan: any[], mealsPerDay: number) {
  if (!Array.isArray(mealPlan) || mealPlan.length !== 7) {
    throw new Error("Incomplete meal plan");
  }

  for (const [index, day] of mealPlan.entries()) {
    if (!Array.isArray(day?.meals) || day.meals.length !== mealsPerDay) {
      throw new Error(`Incomplete day ${index + 1}`);
    }
  }
}

function validateMealPlanNutrition(mealPlan: any[], rawTargets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  const targets = harmonizeDailyTargets(rawTargets);
  const expectedCalories = macroKcal(
    targets.dailyProtein,
    targets.dailyCarbs,
    targets.dailyFat,
  );

  for (const [dayIndex, day] of mealPlan.entries()) {
    const totals = sumMeals(day.meals || []);
    if (
      totals.protein !== targets.dailyProtein ||
      totals.carbs !== targets.dailyCarbs ||
      totals.fat !== targets.dailyFat ||
      totals.calories !== expectedCalories
    ) {
      throw new Error(`Nutrition mismatch on day ${dayIndex + 1}`);
    }

    for (const meal of day.meals || []) {
      const expectedMealCalories = macroKcal(
        Number(meal.protein) || 0,
        Number(meal.carbs) || 0,
        Number(meal.fat) || 0,
      );
      if ((Number(meal.calories) || 0) !== expectedMealCalories) {
        throw new Error(`Meal kcal mismatch on day ${dayIndex + 1}`);
      }
    }
  }
}

function inferMealType(name: string, type: string): "breakfast" | "main" | "snack" {
  const blob = `${name} ${type}`.toLowerCase();
  if (/(frühstück|breakfast|petit|snack|zwischenmahlzeit|dessert)/i.test(blob)) return "breakfast";
  if (/(mittag|abend|lunch|dinner|dejeuner|dejeuner|diner|dîner)/i.test(blob)) return "main";
  return "snack";
}

function validateMealPlausibility(
  mealPlan: any[],
  targets: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number },
  mealsPerDay: number,
) {
  const avgMealKcal = Math.max(120, Math.round(targets.dailyCalories / Math.max(1, mealsPerDay)));

  for (const [dayIdx, day] of mealPlan.entries()) {
    for (const [mealIdx, meal] of (day.meals || []).entries()) {
      const name = String(meal?.name || "Gericht");
      const type = String(meal?.type || "Mahlzeit");
      const p = Math.max(0, Number(meal?.protein) || 0);
      const c = Math.max(0, Number(meal?.carbs) || 0);
      const f = Math.max(0, Number(meal?.fat) || 0);
      const kcal = Math.max(0, Number(meal?.calories) || 0);
      const macroKcalValue = macroKcal(p, c, f);
      const inferred = inferMealType(name, type);

      const minKcal =
        inferred === "main"
          ? Math.max(260, Math.round(avgMealKcal * 0.65))
          : inferred === "breakfast"
            ? Math.max(180, Math.round(avgMealKcal * 0.45))
            : Math.max(140, Math.round(avgMealKcal * 0.35));
      const maxKcal =
        inferred === "main"
          ? Math.min(1250, Math.round(avgMealKcal * 1.95))
          : inferred === "breakfast"
            ? Math.min(900, Math.round(avgMealKcal * 1.45))
            : Math.min(700, Math.round(avgMealKcal * 1.2));

      if (kcal < minKcal || kcal > maxKcal) {
        throw new Error(`Unplausible meal kcal on day ${dayIdx + 1}, meal ${mealIdx + 1}: ${name}`);
      }

      if (macroKcalValue <= 0) {
        throw new Error(`Invalid macro values on day ${dayIdx + 1}, meal ${mealIdx + 1}: ${name}`);
      }

      const proteinShare = (p * 4) / macroKcalValue;
      const carbsShare = (c * 4) / macroKcalValue;
      const fatShare = (f * 9) / macroKcalValue;

      if (proteinShare > 0.62 || carbsShare > 0.82 || fatShare > 0.72) {
        throw new Error(`Macro split unrealistic on day ${dayIdx + 1}, meal ${mealIdx + 1}: ${name}`);
      }
    }
  }
}

function buildMealPlanPrompts(params: {
  mealsPerDay: number;
  macroTargets: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number };
  constraintPrompt: string;
  fridgeHint: string;
  isRegeneration: boolean;
  varietySeed: string;
  previousMealNames: string[];
  maxIngredients: number;
  language: SupportedLanguage;
}) {
  const config = LANGUAGE_CONFIG[params.language];
  const totalMeals = 7 * params.mealsPerDay;
  const compactRule = `Halte die Antwort kompakt:
- Pro Mahlzeit maximal ${params.maxIngredients} Zutaten
- Kurze, klare Rezeptnamen
- instructions darf leer sein ([]) oder maximal 1 kurzer Satz sein; die App ergänzt Kochschritte automatisch.`;

  const systemPrompt = `Du bist ein ${config.expertLabel} Ernährungsexperte und planst realistische Mahlzeiten.

Erstelle einen VOLLSTÄNDIGEN Wochenplan - niemals leere Tage oder unvollständige Pläne.

REGELN:
- Genau 7 Tage (${config.dayNames.join("-")})
- Pro Tag genau ${params.mealsPerDay} Mahlzeiten
- Einfache Hausmannskost, keine exotischen Zutaten
- Normale deutsche Alltagsküche: Müsli, Porridge, Brot mit Aufstrich, Eier, Joghurt, Obst; Mittag/Abend: Nudeln, Reis, Kartoffeln, Fleisch/Fisch mit Gemüse, Pfannengerichte, Suppe mit Brot
- VERBOTEN: Smoothies, Shakes, Protein-Shakes, Saftfasten, Detox-Drinks, Green Smoothies, Spinat-Shake, nur-Flüssig-Mahlzeiten, exotische Trend-Gerichte
- Der Plan darf und soll auch OHNE Kühlschrankscan erstellt werden
- Nutze Kühlschrankzutaten nur wenn vorhanden und sinnvoll; ergänze fehlende Zutaten frei für Makroziele und Abwechslung
- Nährwerte müssen realistisch sein (keine Fantasiewerte)
- Kalorien jeder Mahlzeit MÜSSEN exakt zu den Makros passen: kcal = 4*Protein + 4*Kohlenhydrate + 9*Fett (max. +/-50 kcal Abweichung)
- Makros jeder Mahlzeit müssen zum Gericht passen; keine unrealistischen Protein-/Carb-/Fett-Werte für den Namen der Mahlzeit
- Gib realistische, messbare Makrowerte an
- Prüfe pro Mahlzeit aktiv die Plausibilität mit typischen Nährwerten echter Lebensmittel (z. B. Bundeslebensmittelschlüssel/USDA-ähnliche Werte), keine geschätzten Fantasiezahlen
- Jede Mahlzeit braucht eine realistische Portionsgröße; Kalorien und Makros müssen zur Portion und zum Gerichtsnamen passen
- Antworte bei ALLEN sichtbaren Textfeldern (day, type, name, ingredients.amount, ingredients.name, instructions) konsequent auf ${config.outputLabel}
${params.constraintPrompt ? "- Allergien, Ernährungsziele und weitere Onboarding-Vorgaben unten sind ABSOLUT bindend." : ""}
${params.isRegeneration && params.previousMealNames.length > 0 ? "- Bei NEUGENERIERUNG darf keine Mahlzeit denselben Namen oder dieselbe Kerngericht-Idee wie im vorherigen Plan wiederholen. Jede einzelne Mahlzeit braucht einen neuen, klar anderen Namen." : ""}
${compactRule}

PRO TAG müssen die Summen ALLER Mahlzeiten EXAKT diesen Zielen entsprechen:
- Kalorien: ${params.macroTargets.dailyCalories} kcal
- Protein: ${params.macroTargets.dailyProtein} g
- Kohlenhydrate: ${params.macroTargets.dailyCarbs} g
- Fett: ${params.macroTargets.dailyFat} g
${params.isRegeneration ? `- NEUGENERIERUNG (${params.varietySeed}): Alle ${totalMeals} Mahlzeiten sollen anders sein als in Standardplänen.` : ""}

Jede Mahlzeit MUSS enthalten:
type, name, calories, protein, carbs, fat, prepTime, ingredients

ingredients MUSS pro Zutat enthalten:
name, amount (mit Einheit), price (geschaetzter Preis in EUR)

instructions ist OPTIONAL und darf leer sein.

Antwort NUR als JSON:
{
 "mealPlan":[
  {
   "day":"${config.dayNames[0]}",
   "meals":[]
  }
 ]
}`;

  const userPrompt = [
    `Erstelle einen vollständigen 7-Tage-Plan mit ${params.mealsPerDay} Mahlzeiten pro Tag.`,
    `Insgesamt also genau ${totalMeals} Mahlzeiten.`,
    `Tagesziele: ${params.macroTargets.dailyCalories} kcal, Protein ${params.macroTargets.dailyProtein}g, Kohlenhydrate ${params.macroTargets.dailyCarbs}g, Fett ${params.macroTargets.dailyFat}g.`,
    `Die Ausgabe-Sprache muss ${config.outputLabel} sein.`,
    params.isRegeneration
      ? `Plan-ID ${params.varietySeed}: Erstelle einen komplett neuen Wochenplan.`
      : "",
    params.isRegeneration && params.previousMealNames.length > 0
      ? `Verbotene Mahlzeiten aus dem bisherigen Plan (ALLE ${params.previousMealNames.length} müssen durch komplett neue, alltägliche Gerichte ersetzt werden – keine Umbenennungen, keine Shakes/Smoothies): ${params.previousMealNames.join(", ")}.`
      : "",
    params.fridgeHint,
    params.constraintPrompt
      ? `\n\n--- Nutzer-Vorgaben (verbindlich) ---\n${params.constraintPrompt}`
      : "",
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function parseOpenAIJsonPayload(content: string): { mealPlan?: unknown } {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("No response from OpenAI");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const withoutCodeFence = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(withoutCodeFence);
    } catch {
      const startIdx = withoutCodeFence.indexOf("{");
      const endIdx = withoutCodeFence.lastIndexOf("}");
      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        throw new Error("Invalid JSON from OpenAI");
      }
      return JSON.parse(withoutCodeFence.substring(startIdx, endIdx + 1));
    }
  }
}

async function requestMealPlanFromOpenAI(params: {
  mealsPerDay: number;
  macroTargets: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number };
  constraintPrompt: string;
  fridgeHint: string;
  isRegeneration: boolean;
  varietySeed: string;
  previousMealNames: string[];
  language: SupportedLanguage;
}) {
  let lastError: Error | null = null;
  const config = LANGUAGE_CONFIG[params.language];

  for (const attempt of OPENAI_ATTEMPTS) {
    try {
      const { systemPrompt, userPrompt } = buildMealPlanPrompts({
        ...params,
        maxIngredients: attempt.maxIngredients,
      });
      const response = await fetch(OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: params.isRegeneration ? 0.72 : 0.32,
          max_tokens: attempt.maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const finishReason = data.choices?.[0]?.finish_reason;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log(`[MEAL-PLAN-EDGE] ${attempt.name} response length: ${String(content).length}, finish_reason: ${finishReason ?? "unknown"}`);

      if (finishReason === "length") {
        throw new Error("OpenAI response truncated");
      }

      let parsed: { mealPlan?: unknown };
      try {
        parsed = parseOpenAIJsonPayload(content);
      } catch (parseError) {
        const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
        console.warn(
          `[MEAL-PLAN-EDGE] ${attempt.name} parse preview: ${String(content).slice(0, 220).replace(/\s+/g, " ")}`,
        );
        throw new Error(parseMessage || "Invalid JSON from OpenAI");
      }

      const rawMealPlan = parsed.mealPlan;
      if (!Array.isArray(rawMealPlan) || rawMealPlan.length === 0) {
        throw new Error("Empty meal plan");
      }

      const normalizedMealPlan = rawMealPlan.map((day, index) => ({
        day:
          typeof (day as any)?.day === "string" && (day as any).day.trim()
            ? (day as any).day.trim()
            : config.dayNames[index] || `${config.dayFallback} ${index + 1}`,
        meals: Array.isArray((day as any)?.meals)
          ? (day as any).meals.map((meal: any) => normalizeMeal(meal))
          : [],
      }));

      validateMealPlanShape(normalizedMealPlan, params.mealsPerDay);
      validateMealPlausibility(normalizedMealPlan, params.macroTargets, params.mealsPerDay);
      return normalizedMealPlan;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = new Error(message);
      console.warn(`[MEAL-PLAN-EDGE] ${attempt.name} attempt failed: ${message}`);
    }
  }

  throw lastError ?? new Error("Meal plan generation failed");
}

async function resolvePremium(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  const { data: cacheData } = await supabase
    .from("subscription_cache")
    .select("subscribed, subscription_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (cacheData?.subscribed) {
    const active = !cacheData.subscription_end || new Date(cacheData.subscription_end) > new Date();
    if (active) return true;
  }

  if (email?.toLowerCase() === "yousef0089mohamed@gmail.com") return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader === "Bearer null" || authHeader === "Bearer undefined") {
      return new Response(JSON.stringify({ error: "premium_required", message: "Anmeldung erforderlich." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "premium_required", message: "Ungültige Sitzung." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const isPremium = await resolvePremium(supabase, userId, userData.user.email);
    if (!isPremium) {
      return new Response(JSON.stringify({ error: "premium_required", message: "Premium erforderlich." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const constraintPrompt =
      typeof body.constraintPrompt === "string" ? body.constraintPrompt.trim() : "";
    const mealsPerDay = Math.min(6, Math.max(3, Number(body.mealsPerDay) || 5));
    const dailyCalories = Number(body.dailyCalories) || 2000;
    const dailyProtein = Number(body.dailyProtein) || Math.round(dailyCalories * 0.075 / 4);
    const dailyCarbs = Number(body.dailyCarbs) || Math.round(dailyCalories * 0.45 / 4);
    const dailyFat = Number(body.dailyFat) || Math.round(dailyCalories * 0.28 / 9);
    const fridgeIngredients = Array.isArray(body.fridgeIngredients)
      ? body.fridgeIngredients.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const allergies = Array.isArray(body.allergies)
      ? body.allergies.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const dietaryPreferences = Array.isArray(body.dietaryPreferences)
      ? body.dietaryPreferences.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const allergiesOther = typeof body.allergiesOther === "string" ? body.allergiesOther.trim() : "";
    const language = resolveSupportedLanguage(body.language);
    const isRegeneration = body.isRegeneration === true;
    const varietySeed = typeof body.varietySeed === "string" ? body.varietySeed : String(Date.now());
    const previousMealNames = Array.isArray(body.previousMealNames)
      ? body.previousMealNames.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 56)
      : [];

    const macroTargets = harmonizeDailyTargets({
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
    });

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY fehlt auf der Edge Function.",
          message: "Die KI-Wochenplanfunktion ist aktuell nicht konfiguriert.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const fridgeHint =
      fridgeIngredients.length > 0
        ? language === "fr"
          ? `\n\nFrigo (deja disponible - priorise ces ingredients, mais tu peux en ajouter librement si necessaire) :\n${fridgeIngredients.join(", ")}`
          : language === "en"
            ? `\n\nFridge (already available - prioritize these ingredients, but you may freely add more if needed):\n${fridgeIngredients.join(", ")}`
            : `\n\nKühlschrank (bereits vorhanden – priorisiere diese Zutaten, darfst aber beliebig weitere ergänzen):\n${fridgeIngredients.join(", ")}`
        : language === "fr"
          ? "\n\nAucun scan du frigo disponible : cree quand meme un plan hebdomadaire complet avec des ingredients adaptes. La liste de courses contiendra ensuite tout ce qu il faut jusqu a ce qu un scan retire ce qui est deja present."
          : language === "en"
            ? "\n\nNo fridge scan available: still create a complete weekly plan with suitable ingredients. The shopping list should then contain everything needed until a fridge scan subtracts what is already available."
            : "\n\nKein Kühlschrankscan vorhanden: Erstelle trotzdem einen vollständigen Wochenplan frei aus passenden Zutaten. Die Einkaufsliste enthält danach alle benötigten Zutaten, bis ein Kühlschrankscan vorhandene Zutaten abzieht.";

    const aiMealPlan = await requestMealPlanFromOpenAI({
      mealsPerDay,
      macroTargets,
      constraintPrompt,
      fridgeHint,
      isRegeneration,
      varietySeed,
      previousMealNames,
      language,
    });

    const normalizedMealPlan = syncMealPlanToTargets(aiMealPlan, macroTargets);
    validateMealPlanNutrition(normalizedMealPlan, macroTargets);
    validateMealPlausibility(normalizedMealPlan, macroTargets, mealsPerDay);
    const unsafeMeals = findSafetyViolations(normalizedMealPlan, allergies, dietaryPreferences, allergiesOther);
    if (unsafeMeals.length > 0) {
      throw new Error(`Allergy safety validation failed: ${unsafeMeals.slice(0, 5).join("; ")}`);
    }

    const shoppingList = generateGapShoppingList(normalizedMealPlan, fridgeIngredients);
    const scanMeta = computeScanMeta(normalizedMealPlan, fridgeIngredients, shoppingList);

    const weekStart = getWeekStart();
    const { data: usageRow } = await supabase
      .from("meal_plan_usage")
      .select("generation_count")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();

    const nextCount = (usageRow?.generation_count || 0) + 1;
    if (usageRow) {
      await supabase
        .from("meal_plan_usage")
        .update({ generation_count: nextCount, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("week_start", weekStart);
    } else {
      await supabase.from("meal_plan_usage").insert({
        user_id: userId,
        week_start: weekStart,
        generation_count: 1,
      });
    }

    return new Response(
      JSON.stringify({
        mealPlan: normalizedMealPlan,
        shoppingList,
        scanMeta,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message =
      rawMessage.includes("OpenAI response truncated") ||
      rawMessage.includes("Incomplete meal plan") ||
      rawMessage.includes("Invalid JSON from OpenAI") ||
      rawMessage.includes("No response from OpenAI") ||
      rawMessage.includes("Empty meal plan")
        ? "Die Wochenplan-KI konnte keinen vollständigen Plan liefern."
        : rawMessage;
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
