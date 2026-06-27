import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { macroKcal, reconcileTargets } from "./macros.ts";

Deno.test("reconcileTargets harmonized when kcal matches macros", () => {
  const result = reconcileTargets({
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  });
  assertEquals(result.macroAuthority, "harmonized");
  assertEquals(result.warning, undefined);
  assertEquals(result.targets.dailyCalories, 150 * 4 + 200 * 4 + 65 * 9);
});

Deno.test("reconcileTargets macros_primary when kcal diverges too far", () => {
  const result = reconcileTargets({
    dailyCalories: 3500,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  });
  assertEquals(result.macroAuthority, "macros");
  assertEquals(result.warning?.type, "macros_primary");
});

Deno.test("reconcileTargets kcal_scaled when kcal within ratio band", () => {
  const implied = 150 * 4 + 200 * 4 + 65 * 9;
  const stated = Math.round(implied * 1.05);
  const result = reconcileTargets({
    dailyCalories: stated,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  });
  assertEquals(result.macroAuthority, "scaled_to_kcal");
  assertEquals(result.warning?.type, "kcal_scaled");
  assertEquals(result.warning?.statedKcal, stated);
  assertEquals(
    result.targets.dailyCalories,
    macroKcal(result.targets.dailyProtein, result.targets.dailyCarbs, result.targets.dailyFat),
  );
});
