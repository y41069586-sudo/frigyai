/** Regenerates index.ts for Supabase Dashboard (single-file deploy). */
const MODULES = [
  "types.ts",
  "constants.ts",
  "http.ts",
  "normalize.ts",
  "allergens.ts",
  "diets.ts",
  "porkBan.ts",
  "macros.ts",
  "meals.ts",
  "validation.ts",
  "constraints.ts",
  "fallbacks.ts",
  "openai.ts",
  "shopping.ts",
  "auth.ts",
  "sanitize.ts",
  "drafts.ts",
  "repairLoop.ts",
  "buildPlan.ts",
  "planMealSanitize.ts",
  "variety.ts",
  "dietPools.ts",
  "dietPrompts.ts",
  "mealBlueprints.ts",
] as const;

const HANDLER_START = "// ===== HTTP handler =====";

import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.224.0/path/from_file_url.ts";

const root = dirname(dirname(fromFileUrl(import.meta.url)));
const outPath = join(root, "index.ts");

function stripImports(source: string): string {
  return source.replace(
    /^import\s+(?:type\s+)?[\s\S]*?from\s+["'](?:\.\/|https?:)[^"']+["'];?\s*\n/gm,
    "",
  );
}

function processModule(name: string): string {
  let src = Deno.readTextFileSync(join(root, name));
  src = stripImports(src);
  return `// ----- ${name} -----\n${src.trim()}\n`;
}

const header = `// generate-meal-plan — single file for Supabase Dashboard deploy.
// Regenerate: node scripts/inline-index.mjs  (or: deno run --allow-read --allow-write scripts/inline-index.ts)
// Edit auth.ts, macros.ts, … then run the script; paste/deploy only this index.ts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.24.1";

/// <reference lib="deno.ns" />

`;

let handler = Deno.readTextFileSync(join(root, "index.handler.ts"));
handler = stripImports(handler);

const body = MODULES.map(processModule).join("\n");
const full = header + body + "\n" + HANDLER_START + "\n" + handler.trim() + "\n";

Deno.writeTextFileSync(outPath, full);
console.log(`Wrote ${outPath} (${full.split("\n").length} lines)`);
