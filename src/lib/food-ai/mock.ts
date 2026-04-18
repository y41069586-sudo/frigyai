/**
 * Mock-KI für Entwicklung & Demo: Bild-Analyse, Mahlzeiten & Wochenplan.
 * Später durch echte API / Edge Function ersetzen.
 */
import type {
  MockDayPlan,
  MockMeal,
  ShoppingItem,
  UserGoal,
  WeekPlanResult,
} from "./types";

const DAYS_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

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
  ings: { name: string; amount: string }[],
): MockMeal {
  const { cal, proteinBoost } = goalFactors(goal);
  return {
    type,
    name,
    calories: Math.round(base.cal * cal),
    protein: Math.round(base.p * proteinBoost),
    carbs: Math.round(base.c * (goal === "lose" ? 0.92 : 1)),
    fat: Math.round(base.f * (goal === "lose" ? 0.95 : 1.05)),
    prepTime: type === "Frühstück" ? 12 : type === "Mittagessen" ? 25 : 20,
    ingredients: ings.map((i) => ({ name: i.name, amount: i.amount, price: 0 })),
    instructions:
      type === "Frühstück"
        ? ["Zutaten vorbereiten", "Anrichten", "Genießen"]
        : ["Zutaten schneiden", "Braten oder kochen", "Würzen und servieren"],
  };
}

/** Drei Mahlzeiten aus vorhandenen Zutaten (Mock). */
export async function generateMeals(
  ingredients: string[],
  goal: UserGoal,
): Promise<MockMeal[]> {
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
        { name: "Eier", amount: "3" },
        { name: main, amount: "80g" },
        { name: veg, amount: "60g" },
      ],
    ),
    mealTemplate(
      "Mittagessen",
      `Bowl: ${main}, ${carb}, ${veg}`,
      { cal: 620, p: 42, c: 55, f: 18 },
      goal,
      [
        { name: main, amount: "150g" },
        { name: carb, amount: "120g" },
        { name: veg, amount: "100g" },
      ],
    ),
    mealTemplate(
      "Abendessen",
      `Leicht: ${veg}-Pfanne mit ${main}`,
      { cal: 480, p: 35, c: 28, f: 24 },
      goal,
      [
        { name: veg, amount: "200g" },
        { name: main, amount: "120g" },
        { name: "Olivenöl", amount: "1 EL" },
      ],
    ),
  ];
}

/** 7-Tage-Plan + Einkaufsliste (fehlende Zutaten mock). */
export async function generateWeekPlan(
  ingredients: string[],
  goal: UserGoal,
): Promise<WeekPlanResult> {
  await new Promise((r) => setTimeout(r, 800));
  const h = hashString(ingredients.join(",") + goal);
  const days: MockDayPlan[] = DAYS_DE.map((day, di) => {
    const rotate = (i: number) => ingredients[(h + di * 3 + i) % Math.max(ingredients.length, 1)] || "Zutat";
    const meals: MockMeal[] = [
      mealTemplate(
        "Frühstück",
        `Power-Start ${di + 1}: Haferflocken & ${rotate(0)}`,
        { cal: 410, p: 18, c: 52, f: 12 },
        goal,
        [
          { name: "Haferflocken", amount: "60g" },
          { name: rotate(0), amount: "50g" },
          { name: "Milch", amount: "200ml" },
        ],
      ),
      mealTemplate(
        "Mittagessen",
        `Mittags-Highlight: ${rotate(1)} mit ${rotate(2)}`,
        { cal: 640, p: 44, c: 48, f: 20 },
        goal,
        [
          { name: rotate(1), amount: "180g" },
          { name: rotate(2), amount: "150g" },
        ],
      ),
      mealTemplate(
        "Abendessen",
        `Abend: ${rotate(3)}-Pfanne`,
        { cal: 520, p: 32, c: 35, f: 22 },
        goal,
        [
          { name: rotate(3), amount: "200g" },
          { name: "Knoblauch", amount: "1 Zehe" },
        ],
      ),
    ];
    return { day, meals };
  });

  const shoppingList: ShoppingItem[] = [
    { name: "Haferflocken", amount: "500g", category: "Grundlagen" },
    { name: "Quinoa", amount: "300g", category: "Grundlagen" },
    { name: "Brokkoli", amount: "400g", category: "Gemüse" },
    { name: "Paprika", amount: "3 Stück", category: "Gemüse" },
    { name: "Hähnchenbrust", amount: "800g", category: "Protein" },
    { name: "Griechischer Joghurt", amount: "500g", category: "Molkerei" },
    { name: "Parmesan", amount: "150g", category: "Molkerei" },
    { name: "Olivenöl", amount: "1 Flasche", category: "Vorräte" },
  ].filter((_, i) => (h + i) % 3 !== 0);

  return { days, shoppingList };
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
