import { z } from "https://esm.sh/zod@3.24.1";
import {
  ALLERGEN_TAG_IDS,
  getOpenAIKey,
  getOpenAIMealPlanModel,
  LANG,
  OPENAI_MAX_INGREDIENTS_PER_MEAL,
  OPENAI_PLAN_MAX_TOKENS,
} from "./constants.ts";
import { normalizeMealStructure } from "./macros.ts";
import { auditPlan } from "./validation.ts";
import type { AiDraftResult, Lang, MacroTargets, MealPlan, PlanInput, PriorDishSnapshot } from "./types.ts";
import {
  buildDietMandatoryBlock,
  buildRegenerationUserPrompt,
  buildSimpleFoodStyleBlock,
} from "./dietPrompts.ts";
import { formatPriorDishesForPrompt } from "./variety.ts";

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

/** No-op kept for handler compatibility (single OpenAI call per request). */
export function resetOpenAiCallBudget(): void {}

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function coerceOpenAiJsonValue(content: unknown): unknown {
  if (content == null || content === "") throw new Error("Empty OpenAI response");
  if (typeof content === "object") return content;
  if (typeof content !== "string") throw new Error("Unexpected OpenAI content type");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Empty OpenAI response");

  try {
    return JSON.parse(trimmed);
  } catch {
    return JSON.parse(extractJsonPayload(trimmed));
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
  const names = banned.map((n) => n.trim()).filter(Boolean).slice(0, 16);
  if (!names.length) return "";
  return `Avoid repeating: ${names.join("; ")}`;
}

function buildCompactSystemPrompt(params: {
  lang: Lang;
  mealsPerDay: number;
  targets: MacroTargets;
  dietBlock: string;
  bannedBlock: string;
  constraints: string;
  maxIngredients: number;
}): string {
  const L = LANG[params.lang];
  return [
    `Nutrition expert. JSON only (${L.lang}). Exactly 7 days: ${L.days.join(", ")}.`,
    `Exactly ${params.mealsPerDay} meals per day. Complete week — no empty days.`,
    buildSimpleFoodStyleBlock(params.lang, params.mealsPerDay),
    `Per meal: type, name, protein, carbs, fat, prepTime, ingredients[{name,amount,price}], instructions[], allergenTags[].`,
    `Max ${params.maxIngredients} ingredients per meal. instructions MUST be [] (empty array) — never "no food" / "kein essen".`,
    `Every meal needs a REAL dish name (e.g. "Chicken Rice Bowl") — NEVER "Friday Meal 3" or "Meal 2".`,
    `allergenTags: gluten,lactose,milk,nuts,treeNuts,peanuts,soy,eggs,fish,shellfish,none.`,
    `Daily targets ~${params.targets.dailyProtein}P/${params.targets.dailyCarbs}C/${params.targets.dailyFat}F. No smoothies.`,
    params.dietBlock,
    params.bannedBlock,
    params.constraints ? `Constraints:\n${params.constraints.slice(0, 1200)}` : "",
  ].filter(Boolean).join("\n");
}

async function callOpenAIOnce(params: {
  mealsPerDay: number;
  targets: MacroTargets;
  constraints: string;
  lang: Lang;
  banned: string[];
  isRegeneration?: boolean;
  priorDishes?: PriorDishSnapshot[];
  dietBlock?: string;
  prefs: string[];
}): Promise<MealPlan> {
  const L = LANG[params.lang];
  const prior = params.priorDishes ?? [];
  const regen = Boolean(params.isRegeneration && (prior.length || params.banned.length));

  const bannedBlock = formatVarietyBlock(prior, params.banned, regen, params.mealsPerDay);
  const dietBlock = params.dietBlock ?? buildDietMandatoryBlock(params.lang, params.prefs);

  const system = buildCompactSystemPrompt({
    lang: params.lang,
    mealsPerDay: params.mealsPerDay,
    targets: params.targets,
    dietBlock,
    bannedBlock,
    constraints: params.constraints,
    maxIngredients: OPENAI_MAX_INGREDIENTS_PER_MEAL,
  });

  const user = regen
    ? buildRegenerationUserPrompt(params.mealsPerDay, params.lang)
    : `Create a full 7-day plan (${params.mealsPerDay} meals/day). Different dish names each day. International everyday food. Vary protein/carbs/fat per meal (snacks smaller, mains larger). Tag allergens.`;

  const openAiKey = getOpenAIKey();
  if (!openAiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getOpenAIMealPlanModel(),
      temperature: regen ? 0.65 : 0.32,
      max_tokens: OPENAI_PLAN_MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${system}\nReturn {"mealPlan":[7 days with ${params.mealsPerDay} meals each]}.`,
        },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const messageContent = data.choices?.[0]?.message?.content;
  const finishReason = data.choices?.[0]?.finish_reason;
  if (messageContent == null || messageContent === "") throw new Error("Empty OpenAI response");
  if (finishReason === "length") throw new Error("OpenAI response truncated");

  const raw = parseOpenAiMealPlanContent(messageContent);

  return raw.map((day, i: number) => {
    let meals = Array.isArray(day?.meals)
      ? day.meals.slice(0, params.mealsPerDay).map(normalizeMealStructure)
      : [];
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

export async function fetchAIWeeklyPlan(input: PlanInput): Promise<MealPlan> {
  return await callOpenAIOnce({
    mealsPerDay: input.mealsPerDay,
    targets: input.targets,
    constraints: input.constraints,
    lang: input.lang,
    banned: input.banned,
    isRegeneration: input.isRegeneration,
    priorDishes: input.priorDishes,
    prefs: input.prefs,
  });
}

export async function generateAIDraft(input: PlanInput): Promise<AiDraftResult> {
  if (!getOpenAIKey()) {
    return { plan: null, failureReason: "OPENAI_API_KEY fehlt auf dem Server." };
  }

  try {
    const raw = await fetchAIWeeklyPlan(input);
    const audited = auditPlan(raw, input.safetyCtx);
    const allergyFree = audited.every((v) => v.allergy.length === 0);
    if (allergyFree) return { plan: raw };
    console.warn(`[MEAL-PLAN] AI plan has ${audited.length} safety flags — using plan (local repair may follow)`);
    return { plan: raw };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("[MEAL-PLAN] OpenAI failed:", message);
    return { plan: null, failureReason: message };
  }
}
