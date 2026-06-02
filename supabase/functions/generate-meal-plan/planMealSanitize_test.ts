import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isPlaceholderMealName } from "./planMealSanitize.ts";

Deno.test("isPlaceholderMealName rejects German slot labels", () => {
  assertEquals(isPlaceholderMealName("Hauptgericht 1"), true);
  assertEquals(isPlaceholderMealName("Frühstück 2"), true);
  assertEquals(isPlaceholderMealName("Mo Hauptgericht 3"), true);
  assertEquals(isPlaceholderMealName("Reis mit Hackfleisch"), false);
});
