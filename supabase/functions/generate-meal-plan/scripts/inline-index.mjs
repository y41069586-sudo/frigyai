import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODULES = [
  "types.ts",
  "constants.ts",
  "http.ts",
  "normalize.ts",
  "allergens.ts",
  "diets.ts",
  "porkBan.ts",
  "ingredientSanitize.ts",
  "ingredientDefaults.ts",
  "shoppingAggregate.ts",
  "macros.ts",
  "meals.ts",
  "validation.ts",
  "constraints.ts",
  "shuffle.ts",
  "fallbacks.ts",
  "openai.ts",
  "shopping.ts",
  "auth.ts",
  "sanitize.ts",
  "drafts.ts",
  "repairLoop.ts",
  "buildPlan.ts",
  "variety.ts",
  "dietPools.ts",
  "dietPrompts.ts",
  "mealBlueprints.ts",
  "planMealSanitize.ts",
];

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, "dashboard-bundle.ts");

function stripImports(source) {
  return source.replace(
    /^import\s+(?:type\s+)?[\s\S]*?from\s+["'](?:\.\/|https?:)[^"']+["'];?\s*\n/gm,
    "",
  );
}

const header = `// generate-meal-plan — EINE Datei fürs Supabase Dashboard (Copy & Paste).
// Entwickler: npm run meal-plan:bundle  |  Nutzer: diese Datei komplett ins Dashboard einfügen.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.24.1";

/// <reference lib="deno.ns" />

`;

const body = MODULES.map((name) => {
  const src = stripImports(readFileSync(join(root, name), "utf8"));
  return `// ----- ${name} -----\n${src.trim()}\n`;
}).join("\n");

const handler = stripImports(readFileSync(join(root, "index.handler.ts"), "utf8"));
const full = `${header}${body}\n// ===== HTTP handler =====\n${handler.trim()}\n`;

writeFileSync(outPath, full);
console.log(`Wrote ${outPath} (${full.split("\n").length} lines)`);
