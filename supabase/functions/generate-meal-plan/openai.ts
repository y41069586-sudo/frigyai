import { z } from "https://esm.sh/zod@3.24.1";
import { zodToJsonSchema } from "https://esm.sh/zod-to-json-schema@3.23.5?target=deno";
import { ALLERGEN_TAG_IDS, getOpenAIKey, LANG } from "./constants.ts";
import { normalizeMealStructure } from "./macros.ts";
import {
  auditPlan,
  shouldAbortAiRetries,
  violationWeight,
  violationsToStrings,
} from "./validation.ts";
import type { Lang, MacroTargets, MealPlan, PlanInput, PriorDishSnapshot } from "./types.ts";
import { buildDietMandatoryBlock, buildRegenerationUserPrompt } from "./dietPrompts.ts";
import { findRegenerationOverlaps, formatPriorDishesForPrompt } from "./variety.ts";

const aiIngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string(),
  price: z.number(),
});

const aiMealSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  prepTime: z.number(),
  ingredients: z.array(aiIngredientSchema),
  instructions: z.array(z.string()),
  allergenTags: z.array(z.enum(ALLERGEN_TAG_IDS)),
});

const aiDaySchema = z.object({
  day: z.string(),
  meals: z.array(aiMealSchema).min(1),
});

const aiPlanSchema = z.object({
  mealPlan: z.array(aiDaySchema).length(7),
});

type AiDayPlan = z.infer<typeof aiDaySchema>;

/** OpenAI json_schema — generated once from Zod (single source of truth). */
export const OPENAI_MEAL_PLAN_JSON_SCHEMA: Record<string, unknown> = (() => {
  const schema = zodToJsonSchema(aiPlanSchema, {
    name: "MealPlanResponse",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/** json_schema responses are JSON strings; accept pre-parsed objects as well. */
function coerceOpenAiJsonValue(content: unknown): unknown {
  if (content == null || content === "") throw new Error("Empty OpenAI response");
  if (typeof content === "object") return content;
  if (typeof content !== "string") throw new Error("Unexpected OpenAI content type");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Empty OpenAI response");
  if (trimmed.length > 120_000) throw new Error("OpenAI response too large");

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return JSON.parse(extractJsonPayload(trimmed));
    } catch {
      throw new Error("Invalid JSON from OpenAI");
    }
  }
}

export function parseOpenAiMealPlanContent(content: unknown): AiDayPlan[] {
  const raw = coerceOpenAiJsonValue(content);
  const parsed = aiPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Schema validation failed: ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
  }
  return parsed.data.mealPlan;
}

function formatVarietyBlock(
  prior: PriorDishSnapshot[],
  banned: string[],
  isRegeneration: boolean,
  mealsPerDay: number,
): string {
  if (isRegeneration && prior.length) {
    return formatPriorDishesForPrompt(prior, mealsPerDay);
  }
  const names = banned.map((n) => n.trim()).filter(Boolean).slice(0, 40);
  if (!names.length) return "";
  const lines: string[] = [];
  for (let i = 0; i < names.length; i += 8) {
    lines.push(names.slice(i, i + 8).join("; "));
  }
  return [`Avoid repeating these meals:`, ...lines].join("\n");
}

export async function callOpenAI(params: {
  mealsPerDay: number;
  targets: MacroTargets;
  constraints: string;
  lang: Lang;
  banned: string[];
  maxTokens: number;
  mode?: "initial" | "repair";
  repairHints?: string[];
  isRegeneration?: boolean;
  priorDishes?: PriorDishSnapshot[];
  dietBlock?: string;
}): Promise<MealPlan> {
  const L = LANG[params.lang];
  const prior = params.priorDishes ?? [];
  const regen = Boolean(params.isRegeneration && (prior.length || params.banned.length));
  const repairBlock =
    params.mode === "repair" && params.repairHints?.length
      ? `\nFIX:\n${params.repairHints.slice(0, 8).map((h) => `- ${h}`).join("\n")}`
      : "";

  const bannedBlock = formatVarietyBlock(prior, params.banned, regen, params.mealsPerDay);

  const dietBlock = params.dietBlock ?? "";

  const system = [
    `Nutrition coach. JSON only (${L.lang}). 7d: ${L.days.join(",")}. ${params.mealsPerDay} meals/d.`,
    `Fields: type,name,protein,carbs,fat,prepTime,ingredients[{name,amount,price}],instructions[],allergenTags[].`,
    `allergenTags: gluten,lactose,milk,nuts,treeNuts,peanuts,soy,eggs,fish,shellfish|none. instructions:[].`,
    `Server→${params.targets.dailyProtein}P/${params.targets.dailyCarbs}C/${params.targets.dailyFat}F g/d. No smoothies.`,
    dietBlock,
    bannedBlock,
    params.constraints ? `Constraints:\n${params.constraints}` : "",
    repairBlock,
  ].filter(Boolean).join("\n");

  const user = regen
    ? params.mode === "repair"
      ? `Still repeating old dishes. ${buildRegenerationUserPrompt(params.mealsPerDay, params.lang)}`
      : buildRegenerationUserPrompt(params.mealsPerDay, params.lang)
    : params.mode === "repair"
      ? `Regenerate 7-day plan (${params.mealsPerDay}/day). Strict compliance.`
      : `Create 7-day plan (${params.mealsPerDay}/day). Tag allergens per meal. Follow the mandatory diet rules exactly.`;

  const openAiKey = getOpenAIKey();
  if (!openAiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: regen
        ? params.mode === "repair"
          ? 0.45
          : 0.72
        : params.mode === "repair"
          ? 0.15
          : 0.35,
      max_tokens: params.maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meal_plan",
          strict: true,
          schema: OPENAI_MEAL_PLAN_JSON_SCHEMA,
        },
      },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const messageContent = data.choices?.[0]?.message?.content;
  if (messageContent == null || messageContent === "") throw new Error("Empty OpenAI response");
  if (data.choices?.[0]?.finish_reason === "length") throw new Error("Truncated response");

  const raw = parseOpenAiMealPlanContent(messageContent);

  return raw.map((day, i: number) => {
    let meals = Array.isArray(day?.meals) ? day.meals.slice(0, params.mealsPerDay).map(normalizeMealStructure) : [];
    while (meals.length < params.mealsPerDay) {
      meals.push(
        normalizeMealStructure({
          name: `${L.meal} ${meals.length + 1}`,
          type: L.meal,
          protein: 0,
          carbs: 0,
          fat: 0,
          prepTime: 15,
          ingredients: [{ name: "Gemüse", amount: "1 Portion", price: 1 }],
          instructions: [],
          allergenTags: ["none"],
        }),
      );
    }
    return {
      day: String(day?.day || L.days[i] || `Day ${i + 1}`).trim(),
      meals,
    };
  });
}

export async function generateAIDraft(input: PlanInput): Promise<MealPlan | null> {
  if (!getOpenAIKey()) {
    console.warn("[MEAL-PLAN] OPENAI_API_KEY fehlt – Vorlagen-Plan ohne KI");
    return null;
  }

  const attempts: { maxTokens: number; mode: "initial" | "repair" }[] = input.isRegeneration
    ? [
        { maxTokens: 4000, mode: "initial" },
        { maxTokens: 3600, mode: "repair" },
        { maxTokens: 3600, mode: "repair" },
        { maxTokens: 3600, mode: "repair" },
        { maxTokens: 3600, mode: "repair" },
      ]
    : [
        { maxTokens: 3600, mode: "initial" },
        { maxTokens: 3200, mode: "repair" },
        { maxTokens: 3200, mode: "repair" },
      ];

  let repairHints: string[] = [];
  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex++) {
    const attempt = attempts[attemptIndex]!;
    try {
      const raw = await callOpenAI({
        mealsPerDay: input.mealsPerDay,
        targets: input.targets,
        constraints: input.constraints,
        lang: input.lang,
        banned: input.banned,
        maxTokens: attempt.maxTokens,
        mode: attempt.mode,
        repairHints: attempt.mode === "repair" ? repairHints : undefined,
        isRegeneration: input.isRegeneration,
        priorDishes: input.priorDishes,
        dietBlock: buildDietMandatoryBlock(input.lang, input.prefs),
      });
      const audited = auditPlan(raw, input.safetyCtx);
      const violations = violationsToStrings(audited);

      if (input.isRegeneration && (input.priorDishes?.length || input.banned.length)) {
        const prior = input.priorDishes ?? [];
        const reused = findRegenerationOverlaps(raw, prior);
        if (reused.length) {
          repairHints = [
            `Still same dishes as old week (${reused.length}): ${reused.slice(0, 8).join("; ")}`,
            ...repairHints,
          ];
          console.warn(`[MEAL-PLAN] Regeneration repeated ${reused.length} dish(es)`);
          continue;
        }
      }

      if (!violations.length) return raw;

      const isLast = attemptIndex === attempts.length - 1;
      const allergyFree = audited.every((v) => v.allergy.length === 0);

      if (isLast && allergyFree) {
        console.warn(
          `[MEAL-PLAN] Using AI plan on final attempt (${audited.length} minor diet flags)`,
        );
        return raw;
      }

      if (shouldAbortAiRetries(audited) && !input.isRegeneration) {
        const weight = audited.reduce((s, v) => s + violationWeight(v), 0);
        console.warn(
          `[MEAL-PLAN] ${audited.length} violations (weight ${weight}) — aborting AI retries`,
        );
        return null;
      }

      repairHints = violations.slice(0, 12);
      console.warn(`[MEAL-PLAN] AI plan failed safety (${attempt.mode}), ${violations.length} violations`);
      if (attempt.mode === "repair" && !input.isRegeneration) break;
    } catch (e) {
      console.warn("[MEAL-PLAN] OpenAI attempt failed:", e instanceof Error ? e.message : e);
    }
  }
  return null;
}
