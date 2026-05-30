import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { shouldAbortAiRetries, violationWeight } from "./validation.ts";
import type { SafetyViolation } from "./types.ts";

function violation(allergy: string[], diet: string[] = []): SafetyViolation {
  return { day: "Mo", mealName: "Test", allergy, diet };
}

Deno.test("shouldAbortAiRetries ignores high count of diet-only violations", () => {
  const manyDietOnly = Array.from({ length: 30 }, () => violation([], ["vegan"]));
  assertEquals(shouldAbortAiRetries(manyDietOnly), false);
});

Deno.test("shouldAbortAiRetries aborts on weighted allergy load", () => {
  const heavy = Array.from({ length: 10 }, () => violation(["gluten", "milk", "nuts"]));
  const weight = heavy.reduce((s, v) => s + violationWeight(v), 0);
  assertEquals(weight > 48, true);
  assertEquals(shouldAbortAiRetries(heavy), true);
});
