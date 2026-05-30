import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyPresentAllergens } from "./allergens.ts";
import { detectDietViolations } from "./diets.ts";
import { normalizeText } from "./normalize.ts";

Deno.test("vegan diet violation with honey", () => {
  const norm = { ...normalizeText("Haferflocken mit Honig"), key: "test" };
  const present = classifyPresentAllergens(norm, []);
  const violations = detectDietViolations(norm, present, ["vegan"]);
  assertEquals(violations.includes("vegan"), true);
});
