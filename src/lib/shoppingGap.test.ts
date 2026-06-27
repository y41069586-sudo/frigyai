import { describe, expect, it } from "vitest";
import { fridgeCoversIngredient, splitIngredientsByFridgeCoverage } from "./shoppingGap";

describe("fridgeCoversIngredient", () => {
  it("matches canonical egg labels", () => {
    expect(fridgeCoversIngredient("Eier", ["Eier"])).toBe(true);
    expect(fridgeCoversIngredient("6 Eier", ["Freilandeier"])).toBe(true);
  });

  it("does not match eggs via ei substring in hackfleisch", () => {
    expect(fridgeCoversIngredient("Hackfleisch", ["Eier"])).toBe(false);
  });
});

describe("splitIngredientsByFridgeCoverage", () => {
  it("puts each plan ingredient in only one list", () => {
    const plan = [
      {
        day: "Mo",
        meals: [
          {
            ingredients: [
              { name: "Eier", amount: "4", price: 2 },
              { name: "Milch", amount: "1l", price: 1.2 },
            ],
          },
        ],
      },
    ];
    const { present, missing } = splitIngredientsByFridgeCoverage(plan, ["Eier"]);
    expect(present).toContain("Eier");
    expect(missing.map((m) => m.name)).not.toContain("Eier");
    expect(missing.some((m) => /milch/i.test(m.name))).toBe(true);
  });
});
