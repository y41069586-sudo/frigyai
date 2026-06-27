import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyPresentAllergens } from "./allergens.ts";
import { normalizeText } from "./normalize.ts";

Deno.test("eggplant does not trigger egg allergen", () => {
  const norm = normalizeText("Grilled eggplant with herbs");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("eggs"), false);
});

Deno.test("hafermilch does not trigger dairy allergen", () => {
  const norm = normalizeText("Hafermilch mit Zimt");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("milk"), false);
  assertEquals(present.has("lactose"), false);
});

Deno.test("milchreis triggers dairy allergen", () => {
  const norm = normalizeText("Milchreis mit Zimt");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("milk") || present.has("lactose"), true);
});

Deno.test("milchreis with hafermilch still counts as dairy", () => {
  const norm = normalizeText("Milchreis mit Hafermilch");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("milk") || present.has("lactose"), true);
});

Deno.test("hafermilch alone does not count as dairy", () => {
  const norm = normalizeText("Overnight oats mit Hafermilch");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("milk"), false);
  assertEquals(present.has("lactose"), false);
});

Deno.test("satay triggers peanut allergen", () => {
  const norm = normalizeText("Hähnchen Satay mit Erdnusssoße");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("peanuts"), true);
});

Deno.test("satay sauce phrase triggers peanut allergen", () => {
  const norm = normalizeText("Tofu bowl with satay sauce");
  const present = classifyPresentAllergens({ ...norm, key: "test" }, []);
  assertEquals(present.has("peanuts"), true);
});
