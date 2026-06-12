import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { macroKcal, reconcileTargets, syncDay } from "./macros.ts";

Deno.test("reconcileTargets harmonized when kcal matches macros", () => {
  const result = reconcileTargets({
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  });
  assertEquals(result.macroAuthority, "harmonized");
  assertEquals(result.warning, undefined);
  assertEquals(result.targets.dailyCalories, 150 * 4 + 200 * 4 + 65 * 9);
});

Deno.test("reconcileTargets scales macros when kcal diverges far below macros", () => {
  const result = reconcileTargets({
    dailyCalories: 1200,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  });
  assertEquals(result.macroAuthority, "scaled_to_kcal");
  assertEquals(result.warning?.type, "kcal_scaled");
  assertEquals(result.targets.dailyCalories, macroKcal(
    result.targets.dailyProtein,
    result.targets.dailyCarbs,
    result.targets.dailyFat,
  ));
  assertEquals(result.targets.dailyCalories <= 1250, true);
});

Deno.test("reconcileTargets kcal_scaled when kcal within ratio band", () => {
  const implied = 150 * 4 + 200 * 4 + 65 * 9;
  const stated = Math.round(implied * 1.05);
  const result = reconcileTargets({
    dailyCalories: stated,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  });
  assertEquals(result.macroAuthority, "scaled_to_kcal");
  assertEquals(result.warning?.type, "kcal_scaled");
  assertEquals(result.warning?.statedKcal, stated);
  assertEquals(
    result.targets.dailyCalories,
    macroKcal(result.targets.dailyProtein, result.targets.dailyCarbs, result.targets.dailyFat),
  );
});

Deno.test("syncDay redistributes when one AI meal dominates daily kcal", () => {
  const targets = reconcileTargets({
    dailyCalories: 1200,
    dailyProtein: 90,
    dailyCarbs: 120,
    dailyFat: 40,
  }).targets;

  const day = syncDay(
    {
      day: "Montag",
      meals: [
        { type: "Frühstück", name: "Haferflocken", protein: 10, carbs: 40, fat: 5, calories: 0, prepTime: 10, ingredients: [], instructions: [] },
        { type: "Mittag", name: "Leberkäse Semmel", protein: 80, carbs: 60, fat: 50, calories: 0, prepTime: 5, ingredients: [], instructions: [] },
        { type: "Snack", name: "Apfel", protein: 1, carbs: 20, fat: 0, calories: 0, prepTime: 2, ingredients: [], instructions: [] },
        { type: "Abend", name: "Salat", protein: 15, carbs: 10, fat: 8, calories: 0, prepTime: 15, ingredients: [], instructions: [] },
        { type: "Snack", name: "Joghurt", protein: 12, carbs: 8, fat: 3, calories: 0, prepTime: 2, ingredients: [], instructions: [] },
      ],
    },
    targets,
    5,
    0,
  );

  const total = (day.meals || []).reduce((sum, m) => sum + m.calories, 0);
  const maxMeal = Math.max(...(day.meals || []).map((m) => m.calories));
  assertEquals(total, targets.dailyCalories);
  assert(maxMeal <= targets.dailyCalories * 0.36 + 30);
});
