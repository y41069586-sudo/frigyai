import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  dishFitsDailyBudget,
  mealCaloriesUnrealisticForDish,
} from "./mealCalorieHints.ts";
import { macroKcal, syncDay } from "./macros.ts";
import { swapUnrealisticDishNames } from "./mealRealism.ts";
import { createSafetyContext } from "./validation.ts";

const ctx = createSafetyContext([], ["balanced"], "");

Deno.test("Hähnchen-Wrap does not fit very low daily calorie budget", () => {
  assertEquals(dishFitsDailyBudget("Hähnchen-Wrap", "Mittagessen", 1200, 5), false);
});

Deno.test("mealCaloriesUnrealisticForDish flags wrap scaled down to snack kcal", () => {
  const meal = {
    name: "Hähnchen-Wrap",
    type: "Mittagessen",
    protein: 8,
    carbs: 10,
    fat: 3,
    calories: macroKcal(8, 10, 3),
  };
  assert(mealCaloriesUnrealisticForDish(meal, 2000, 5));
});

Deno.test("syncDay does not leave wrap at unrealistically low kcal on 2000 kcal day", () => {
  const day = {
    day: "Montag",
    meals: [
      { type: "Frühstück", name: "Haferflocken", protein: 20, carbs: 50, fat: 8, calories: 0, prepTime: 10, ingredients: [], instructions: [] },
      { type: "Mittag", name: "Hähnchen-Wrap", protein: 25, carbs: 45, fat: 12, calories: 0, prepTime: 15, ingredients: [], instructions: [] },
      { type: "Snack", name: "Apfel", protein: 1, carbs: 20, fat: 0, calories: 0, prepTime: 5, ingredients: [], instructions: [] },
      { type: "Abend", name: "Salat", protein: 20, carbs: 15, fat: 10, calories: 0, prepTime: 12, ingredients: [], instructions: [] },
      { type: "Snack", name: "Joghurt", protein: 15, carbs: 10, fat: 5, calories: 0, prepTime: 5, ingredients: [], instructions: [] },
    ],
  };
  const targets = { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 };
  const synced = syncDay(day, targets, 5, 0);
  const wrap = synced.meals.find((m) => /wrap/i.test(m.name));
  if (wrap) {
    assert(
      !mealCaloriesUnrealisticForDish(wrap, 2000, 5),
      `wrap kcal unrealistic: ${wrap.calories}`,
    );
  }
});

Deno.test("swapUnrealisticDishNames replaces heavy dish when kcal budget too low", () => {
  const plan = [
    {
      day: "Montag",
      meals: [
        {
          type: "Mittagessen",
          name: "Hähnchen-Wrap",
          prepTime: 15,
          ingredients: [],
          instructions: [],
          allergenTags: [],
          protein: 10,
          carbs: 12,
          fat: 4,
          calories: 120,
        },
      ],
    },
  ];
  const swapped = swapUnrealisticDishNames(
    plan,
    { dailyCalories: 1200, dailyProtein: 90, dailyCarbs: 120, dailyFat: 40 },
    5,
    "de",
    ["balanced"],
    ctx,
    "test-seed",
  );
  assert(!/wrap/i.test(swapped[0]!.meals[0]!.name));
});
