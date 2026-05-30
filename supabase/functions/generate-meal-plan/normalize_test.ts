import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mealContentKey, normalizeText, termMatches, termMatchesWordBoundary } from "./normalize.ts";

Deno.test("termMatchesWordBoundary uses string scan (no RegExp)", () => {
  assertEquals(termMatchesWordBoundary("reis mit milch und honig", "milch"), true);
  assertEquals(termMatchesWordBoundary("hafermilch", "milch"), false);
  assertEquals(termMatchesWordBoundary("milchreis", "milch"), false);
});

Deno.test("termMatches short egg uses boundary not substring in eggplant", () => {
  const norm = normalizeText("Grilled eggplant");
  assertEquals(termMatches({ ...norm, key: "x" }, "ei"), false);
});

Deno.test("mealContentKey includes instructions and ingredient amounts", () => {
  const keyA = mealContentKey({
    name: "Bowl",
    ingredients: [{ name: "Reis", amount: "100g" }],
    instructions: ["Kochen"],
    allergenTags: ["none"],
  });
  const keyB = mealContentKey({
    name: "Bowl",
    ingredients: [{ name: "Reis", amount: "200g" }],
    instructions: ["Kochen"],
    allergenTags: ["none"],
  });
  const keyC = mealContentKey({
    name: "Bowl",
    ingredients: [{ name: "Reis", amount: "100g" }],
    instructions: ["Dämpfen"],
    allergenTags: ["none"],
  });
  assertEquals(keyA === keyB, false);
  assertEquals(keyA === keyC, false);
});
