import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  aiMacrosUnrealisticForDishes,
  dishCalorieTier,
  dishMinimumKcal,
} from "./mealCalorieHints.ts";
import { macroKcal, syncDay } from "./macros.ts";

Deno.test("dishCalorieTier classifies heavy Austrian dishes", () => {
  assertEquals(dishCalorieTier("Leberkäse-Semmel"), "heavy");
  assertEquals(dishCalorieTier("Schnitzel mit Pommes"), "heavy");
  assertEquals(dishCalorieTier("Griechischer Salat"), "light");
  assertEquals(dishCalorieTier("Apfel mit Joghurt"), "snack");
});

Deno.test("aiMacrosUnrealisticForDishes flags under-estimated heavy dishes", () => {
  const meals = [
    { name: "Leberkäse-Semmel", type: "Mittagessen", protein: 18, carbs: 35, fat: 12 },
    { name: "Griechischer Salat", type: "Abendessen", protein: 12, carbs: 10, fat: 8 },
  ];
  const kcal = macroKcal(18, 35, 12);
  assert(kcal < 480);
  assert(aiMacrosUnrealisticForDishes(meals, 2000, 4));
});

Deno.test("syncDay assigns realistic kcal to heavy dishes", () => {
  const day = {
    day: "Montag",
    meals: [
      { type: "Frühstück", name: "Haferflocken mit Beeren", prepTime: 10, ingredients: [], instructions: [], allergenTags: [], protein: 0, carbs: 0, fat: 0, calories: 0 },
      { type: "Mittagessen", name: "Leberkäse-Semmel", prepTime: 15, ingredients: [], instructions: [], allergenTags: [], protein: 0, carbs: 0, fat: 0, calories: 0 },
      { type: "Snack", name: "Apfel", prepTime: 5, ingredients: [], instructions: [], allergenTags: [], protein: 0, carbs: 0, fat: 0, calories: 0 },
      { type: "Abendessen", name: "Hähnchen mit Reis", prepTime: 25, ingredients: [], instructions: [], allergenTags: [], protein: 0, carbs: 0, fat: 0, calories: 0 },
    ],
  };
  const targets = { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 };
  const synced = syncDay(day, targets, 4, 0);
  const leberkase = synced.meals.find((m) => m.name.includes("Leberkäse"));
  assert(leberkase);
  assert(
    leberkase!.calories >= dishMinimumKcal("Leberkäse-Semmel", "Mittagessen", 2000, 4) * 0.85,
    `Leberkäse-Semmel should be >= realistic minimum, got ${leberkase!.calories}`,
  );

  const sum = synced.meals.reduce((a, m) => a + m.calories, 0);
  assertEquals(sum, macroKcal(targets.dailyProtein, targets.dailyCarbs, targets.dailyFat));
});
