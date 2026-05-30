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

Deno.test("tofu scramble is vegan-safe", () => {
  const norm = { ...normalizeText("Tofu-Scramble mit Spinat"), key: "tofu-scramble" };
  const present = classifyPresentAllergens(norm, []);
  const violations = detectDietViolations(norm, present, ["vegan"]);
  assertEquals(violations.includes("vegan"), false);
});

Deno.test("chicken meal violates vegan", () => {
  const norm = { ...normalizeText("Hähnchen Reis Pfanne"), key: "chicken" };
  const present = classifyPresentAllergens(norm, ["none"]);
  const violations = detectDietViolations(norm, present, ["vegan"]);
  assertEquals(violations.includes("vegan"), true);
});
