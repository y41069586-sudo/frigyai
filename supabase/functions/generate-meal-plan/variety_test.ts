import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mealMatchesPriorDish, snapshotPriorMeal } from "./variety.ts";

Deno.test("detects same dish by ingredient overlap not only title", () => {
  const prior = snapshotPriorMeal({
    name: "Linsen Curry",
    ingredients: [
      { name: "Linsen", amount: "200g", price: 1 },
      { name: "Kokosmilch", amount: "200ml", price: 1 },
      { name: "Reis", amount: "1 Portion", price: 1 },
    ],
  });
  const renamed = {
    name: "Rotes Linsen-Kokos Ragout",
    ingredients: [
      { name: "Linsen", amount: "180g", price: 1 },
      { name: "Kokosmilch", amount: "150ml", price: 1 },
      { name: "Basmatireis", amount: "1 Portion", price: 1 },
    ],
  };
  assertEquals(mealMatchesPriorDish(renamed, [prior]), prior.name);
});

Deno.test("different protein counts as new dish", () => {
  const prior = snapshotPriorMeal({
    name: "Tofu Bowl",
    ingredients: [
      { name: "Tofu", amount: "1", price: 1 },
      { name: "Reis", amount: "1", price: 1 },
    ],
  });
  const next = {
    name: "Kichererbsen-Salat",
    ingredients: [
      { name: "Kichererbsen", amount: "1", price: 1 },
      { name: "Quinoa", amount: "1", price: 1 },
    ],
  };
  assertEquals(mealMatchesPriorDish(next, [prior]), null);
});
