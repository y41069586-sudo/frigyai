import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mealContainsPork } from "./porkBan.ts";
import { isMealSafe, createSafetyContext } from "./validation.ts";

Deno.test("mealContainsPork detects pork dishes", () => {
  assertEquals(mealContainsPork({ name: "Schweinesteak mit Pilzen", ingredients: [] }), true);
  assertEquals(mealContainsPork({ name: "Hähnchen mit Reis", ingredients: [] }), false);
});

Deno.test("isMealSafe rejects pork for all users", () => {
  const ctx = createSafetyContext([], ["balanced"], "");
  assertEquals(isMealSafe({ name: "Speck und Eier", ingredients: [] }, ctx), false);
  assertEquals(isMealSafe({ name: "Putenpfanne", ingredients: [] }, ctx), true);
});
