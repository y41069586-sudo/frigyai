/**
 * Mock-KI für Entwicklung & Demo: Bild-Analyse, Mahlzeiten & Wochenplan.
 */
import type {
  MockDayPlan,
  MockMeal,
  ShoppingItem,
  UserGoal,
  WeekPlanResult,
} from "./types";
import { buildGapShoppingList, computeFridgeScanStats, reconcileMealPlanMacros } from "@/lib/shoppingGap";
import { categorizeIngredient } from "@/lib/ingredient-categories";

const DAYS_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const MEAL_TYPES: MockMeal["type"][] = [
  "Frühstück",
  "Vormittag",
  "Mittagessen",
  "Snack",
  "Abendessen",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Simuliert Erkennung aus Kühlschrank-Foto (kein echtes ML). */
export async function analyzeImage(imageFile: File | Blob): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  const name = imageFile instanceof File ? imageFile.name : "capture";
  const h = hashString(name + String((imageFile as Blob).size));
  const pool = [
    "Tomaten",
    "Gurke",
    "Paprika",
    "Zwiebel",
    "Knoblauch",
    "Eier",
    "Milch",
    "Joghurt",
    "Hähnchenbrust",
    "Tofu",
    "Reis",
    "Nudeln",
    "Kartoffeln",
    "Brokkoli",
    "Spinat",
    "Käse",
    "Butter",
    "Olivenöl",
    "Zitrone",
    "Avocado",
  ];
  const count = 5 + (h % 5);
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(pool[(h + i * 7) % pool.length]);
  }
  return [...new Set(picked)];
}

function goalFactors(goal: UserGoal): { cal: number; proteinBoost: number } {
  switch (goal) {
    case "lose":
      return { cal: 0.9, proteinBoost: 1.15 };
    case "gain":
      return { cal: 1.12, proteinBoost: 1.2 };
    default:
      return { cal: 1, proteinBoost: 1.05 };
  }
}

function mealTemplate(
  type: MockMeal["type"],
  name: string,
  base: { cal: number; p: number; c: number; f: number },
  goal: UserGoal,
  ings: { name: string; amount: string; price?: number }[],
): MockMeal {
  const { cal, proteinBoost } = goalFactors(goal);
  return {
    type,
    name,
    calories: Math.round(base.cal * cal),
    protein: Math.round(base.p * proteinBoost),
    carbs: Math.round(base.c * (goal === "lose" ? 0.92 : 1)),
    fat: Math.round(base.f * (goal === "lose" ? 0.95 : 1.05)),
    prepTime: type.includes("Snack") ? 8 : type === "Frühstück" ? 12 : type === "Mittagessen" ? 25 : 20,
    ingredients: ings.map((i) => ({
      name: i.name,
      amount: i.amount,
      price: i.price ?? 1.2,
    })),
    instructions:
      type.includes("Snack")
        ? ["Zubereiten", "Portionieren"]
        : type === "Frühstück"
          ? ["Zutaten vorbereiten", "Anrichten", "Genießen"]
          : ["Zutaten schneiden", "Braten oder kochen", "Würzen und servieren"],
  };
}

/** Drei Mahlzeiten aus vorhandenen Zutaten (Mock). */
export async function generateMeals(ingredients: string[], goal: UserGoal): Promise<MockMeal[]> {
  await new Promise((r) => setTimeout(r, 500));
  const main =
    ingredients.find((i) => /hähnchen|tofu|ei/i.test(i)) ||
    ingredients[0] ||
    "Protein";
  const veg = ingredients.find((i) => /tomat|gurk|paprika|brokkoli|spinat/i.test(i)) || "Gemüse";
  const carb =
    ingredients.find((i) => /reis|nudel|kartoffel/i.test(i)) || "Beilage";

  return [
    mealTemplate(
      "Frühstück",
      `${main}-Omelett mit ${veg}`,
      { cal: 380, p: 28, c: 12, f: 22 },
      goal,
      [
        { name: "Eier", amount: "3 Stück", price: 0.9 },
        { name: main, amount: "80g", price: 2.5 },
        { name: veg, amount: "60g", price: 0.8 },
      ],
    ),
    mealTemplate(
      "Mittagessen",
      `Bowl: ${main}, ${carb}, ${veg}`,
      { cal: 620, p: 42, c: 55, f: 18 },
      goal,
      [
        { name: main, amount: "150g", price: 3.5 },
        { name: carb, amount: "120g", price: 0.6 },
        { name: veg, amount: "100g", price: 1.1 },
      ],
    ),
    mealTemplate(
      "Abendessen",
      `Leicht: ${veg}-Pfanne mit ${main}`,
      { cal: 480, p: 35, c: 28, f: 24 },
      goal,
      [
        { name: veg, amount: "200g", price: 1.4 },
        { name: main, amount: "120g", price: 2.8 },
        { name: "Olivenöl", amount: "1 EL", price: 0.15 },
      ],
    ),
  ];
}

function gapToShoppingItems(gap: ReturnType<typeof buildGapShoppingList>): ShoppingItem[] {
  return gap.map((g) => ({
    name: g.name,
    amount: g.amount,
    price: g.price,
    category: categorizeIngredient(g.name),
  })) as ShoppingItem[];
}

/** 7-Tage-Plan mit 5 Mahlzeiten/Tag, Makros pro Tag ausgerichtet, Einkauf = nur Lücke zur Kühlschrankliste */
export async function generateWeekPlan(
  ingredients: string[],
  goal: UserGoal,
  macroTargets?: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number },
): Promise<WeekPlanResult> {
  await new Promise((r) => setTimeout(r, 900));
  const h = hashString(ingredients.join(",") + goal);
  const targets = {
    dailyCalories: macroTargets?.dailyCalories ?? 2000,
    dailyProtein: macroTargets?.dailyProtein ?? 150,
    dailyCarbs: macroTargets?.dailyCarbs ?? 200,
    dailyFat: macroTargets?.dailyFat ?? 70,
  };

  const rotate = (di: number, i: number) =>
    ingredients[(h + di * 3 + i) % Math.max(ingredients.length, 1)] || "Gemüse";
  const extra = ["Brokkoli", "Quinoa", "Sojasauce", "Zitrone", "Parmesan", "Avocado"];

  const days: MockDayPlan[] = DAYS_DE.map((day, di) => {
    const r0 = rotate(di, 0);
    const r1 = rotate(di, 1);
    const r2 = rotate(di, 2);
    const r3 = rotate(di, 3);
    const x = extra[(h + di) % extra.length];

    const meals: MockMeal[] = [
      mealTemplate(
        MEAL_TYPES[0],
        `Power-Frühstück: Hafer & ${r0}`,
        { cal: 420, p: 20, c: 52, f: 14 },
        goal,
        [
          { name: "Haferflocken", amount: "70g", price: 0.4 },
          { name: r0, amount: "60g", price: 1.2 },
          { name: "Milch", amount: "200ml", price: 0.35 },
          { name: "Beeren", amount: "50g", price: 1.1 },
        ],
      ),
      mealTemplate(
        MEAL_TYPES[1],
        `Protein-Snack: ${r1} & Joghurt`,
        { cal: 220, p: 18, c: 14, f: 10 },
        goal,
        [
          { name: "Griechischer Joghurt", amount: "150g", price: 0.9 },
          { name: r1, amount: "40g", price: 0.6 },
        ],
      ),
      mealTemplate(
        MEAL_TYPES[2],
        `Mittags-Bowl: ${r2}, Reis, ${x}`,
        { cal: 640, p: 44, c: 58, f: 18 },
        goal,
        [
          { name: r2, amount: "180g", price: 3.2 },
          { name: "Reis", amount: "130g", price: 0.45 },
          { name: x, amount: "80g", price: 1.5 },
          { name: "Sesam", amount: "1 TL", price: 0.1 },
        ],
      ),
      mealTemplate(
        MEAL_TYPES[3],
        `Snack: Obst & ${r3}`,
        { cal: 200, p: 6, c: 38, f: 4 },
        goal,
        [
          { name: "Apfel", amount: "1", price: 0.5 },
          { name: r3, amount: "30g", price: 0.7 },
          { name: "Mandeln", amount: "15g", price: 0.55 },
        ],
      ),
      mealTemplate(
        MEAL_TYPES[4],
        `Abend: ${r0}-Pfanne mit ${r2}`,
        { cal: 520, p: 36, c: 32, f: 24 },
        goal,
        [
          { name: r0, amount: "160g", price: 3.0 },
          { name: r2, amount: "120g", price: 1.8 },
          { name: "Olivenöl", amount: "1 EL", price: 0.12 },
          { name: "Knoblauch", amount: "1 Zehe", price: 0.05 },
        ],
      ),
    ];

    return { day, meals };
  });

  const reconciled = reconcileMealPlanMacros(days, targets);
  const gap = buildGapShoppingList(reconciled, ingredients);
  const scanMeta = computeFridgeScanStats(reconciled, ingredients, gap);

  return {
    days: reconciled,
    shoppingList: gapToShoppingItems(gap),
    scanMeta: { percentHave: scanMeta.percentHave, eurosSaved: scanMeta.eurosSaved },
  };
}

/**
 * Grobe Heuristik, falls die KI-Edge-Function nicht erreichbar ist.
 * Konservativ: lieber „unzureichend“ als optimistisch.
 */
export function assessFridgeWeekHeuristic(ingredients: string[]): {
  sufficient: boolean;
  reason: string;
} {
  const unique = [...new Set(ingredients.map((i) => i.trim()).filter(Boolean))];
  if (unique.length < 3) {
    return {
      sufficient: false,
      reason: "Zu wenig verschiedene Zutaten, um eine ganze Woche abzudecken.",
    };
  }
  const text = unique.join(" ").toLowerCase();
  const hasProtein =
    /hähnchen|huhn|pute|rind|schwein|fleisch|wurst|tofu|tempeh|ei|eier|fisch|lachs|thunfisch|linsen|bohnen|kicher|quark|joghurt|käse|milch|feta|hack/i.test(
      text,
    );
  const hasCarb =
    /reis|nudel|nudeln|pasta|kartoffel|kartoffeln|brot|hafer|quinoa|couscous|polenta|spaghetti|penne/i.test(
      text,
    );
  const hasVegOrFruit =
    /tomat|gurk|paprika|salat|brokkoli|spinat|karotte|möhre|zucchini|aubergine|zwiebel|knoblauch|gemüse|apfel|banane|beere|obst|zitrone|avocado|kohl|sellerie/i.test(
      text,
    );
  if (!hasProtein || !hasCarb || !hasVegOrFruit) {
    return {
      sufficient: false,
      reason:
        "Es fehlen wahrscheinlich Protein, Kohlenhydrate oder Gemüse/Obst – für 7 Tage reicht das so nicht.",
    };
  }
  if (unique.length < 6) {
    return {
      sufficient: false,
      reason: "Die Auswahl ist zu klein für abwechslungsreiche Mahlzeiten über eine ganze Woche.",
    };
  }
  return { sufficient: true, reason: "" };
}

/** Gruppiert Einkaufsliste nach Kategorie */
export function groupShoppingByCategory(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const c = item.category || "Sonstiges";
    if (!acc[c]) acc[c] = [];
    acc[c].push(item);
    return acc;
  }, {});
}
