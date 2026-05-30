import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createSafetyContext } from "./validation.ts";
import { buildMealFromDishTitle, parseIngredientNamesFromDishTitle } from "./mealBlueprints.ts";

Deno.test("Joghurt Banane → yoghurt + banana ingredients", () => {
  const names = parseIngredientNamesFromDishTitle("Joghurt Banane");
  assertEquals(names.includes("Joghurt"), true);
  assertEquals(names.includes("Banane"), true);
  assertEquals(names.includes("Gemüse"), false);
});

Deno.test("built meal ingredients match dish title", () => {
  const ctx = createSafetyContext([], [], "");
  const meal = buildMealFromDishTitle("Joghurt Banane", "b", "de", ctx);
  const ingNames = meal.ingredients.map((i) => i.name.toLowerCase()).join(" ");
  assertEquals(ingNames.includes("joghurt"), true);
  assertEquals(ingNames.includes("banane"), true);
  assertEquals(ingNames.includes("gemüse"), false);
});
