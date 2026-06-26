import { z } from "https://esm.sh/zod@3.24.1";
import {
  ALLERGEN_TAG_IDS,
  getOpenAIKey,
  getOpenAIMealPlanModel,
  LANG,
  OPENAI_FETCH_TIMEOUT_MS,
  OPENAI_MAX_INGREDIENTS_PER_MEAL,
  OPENAI_PLAN_MAX_TOKENS,
} from "./constants.ts";
import { normalizeMealStructure } from "./macros.ts";
import { auditPlan } from "./validation.ts";
import type { AiDraftResult, Lang, MacroTargets, MealPlan, PlanInput, PriorDishSnapshot } from "./types.ts";
import type { MealPlanPrefsInput } from "./mealPlanPrefs.ts";
import {
  buildDietMandatoryBlock,
  buildRegenerationUserPrompt,
  buildEverydayDishExample,
  buildSimpleFoodStyleBlock,
  buildCalorieAwareDishBlock,
} from "./dietPrompts.ts";
import { formatPriorDishesForPrompt } from "./variety.ts";
import { buildMealPlanPrefsPromptBlock } from "./mealPlanPrefs.ts";
import { buildNoPorkConstraintBlock } from "./porkBan.ts";
import { mealSlot } from "./meals.ts";

const coerceNumber = z.union([z.number(), z.string()]).transform((v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
});

const coerceAllergenTag = z.union([z.string(), z.number()]).transform((v) => {
  const s = String(v).trim().toLowerCase();
  const hit = ALLERGEN_TAG_IDS.find((id) => id.toLowerCase() === s);
  return hit ?? "none";
});

const aiIngredientSchema = z.object({
  name: z.union([z.string(), z.number()]).transform((v) => String(v).trim()).pipe(z.string().min(1)),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v).trim() || "—"),
  price: coerceNumber,
});

const aiMealSchema = z.object({
  name: z.union([z.string(), z.number()]).transform((v) => String(v).trim()).pipe(z.string().min(1)),
  type: z.union([z.string(), z.number()]).transform((v) => String(v).trim() || "Meal"),
  protein: coerceNumber,
  carbs: coerceNumber,
  fat: coerceNumber,
  prepTime: coerceNumber,
  ingredients: z.array(aiIngredientSchema).default([]),
  instructions: z.array(z.union([z.string(), z.number()]).transform((v) => String(v))).default([]),
  allergenTags: z.array(coerceAllergenTag).default(["none"]),
});

const aiDaySchema = z.object({
  day: z.string(),
  meals: z.array(aiMealSchema).min(1),
});

const aiPlanSchema = z.object({
  mealPlan: z.array(aiDaySchema).min(1).max(7),
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

export function parseOpenAiMealPlanContent(content: unknown, expectedDays = 7): AiDayPlan[] {
  const raw = coerceOpenAiJsonValue(content);
  const parsed = aiPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Schema validation failed: ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
  }
  return parsed.data.mealPlan.slice(0, expectedDays);
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
    buildCalorieAwareDishBlock(params.targets.dailyCalories, params.mealsPerDay, params.lang),
    `Per meal: type, name, protein, carbs, fat, prepTime, ingredients[{name,amount,price}], instructions[], allergenTags[].`,
    `Ingredient amounts MUST be realistic purchase units (e.g. "150g", "200ml", "2 Stück") — never only "1 Portion".`,
    `Ingredient price = estimated EUR cost for that exact amount in a German supermarket (typically €0.20–€4.50 per line).`,
    `Max ${params.maxIngredients} ingredients per meal. instructions MUST be [] (empty array) — never "no food" / "kein essen".`,
    `Every meal needs a REAL everyday dish name (e.g. "${buildEverydayDishExample(params.lang)}") — NEVER "Friday Meal 3", "Meal 2", "Hauptgericht 1", "Mahlzeit 2", or any numbered slot label.`,
    `allergenTags: gluten,lactose,milk,nuts,treeNuts,peanuts,soy,eggs,fish,shellfish,none.`,
    `ACCURATE MACROS REQUIRED: each meal's protein/carbs/fat must reflect REAL nutritional values for the exact ingredient amounts listed — not estimates adjusted to hit a number. Choose portion sizes so all meals together sum to: ${params.targets.dailyProtein}g protein / ${params.targets.dailyCarbs}g carbs / ${params.targets.dailyFat}g fat (${params.targets.dailyCalories} kcal/day). Snacks ~150–350 kcal, main meals ~450–750 kcal. No smoothies.`,
    buildNoPorkConstraintBlock(params.lang),
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
  mealPlanPrefs?: MealPlanPrefsInput;
  singleDay?: { name: string; index: number };
}): Promise<MealPlan> {
  const L = LANG[params.lang];
  const prior = params.priorDishes ?? [];
  const regen = Boolean(params.isRegeneration && (prior.length || params.banned.length));

  const bannedBlock = formatVarietyBlock(prior, params.banned, regen, params.mealsPerDay);
  const dietBlock = params.dietBlock ?? buildDietMandatoryBlock(params.lang, params.prefs);
  const prefsBlock = params.mealPlanPrefs
    ? buildMealPlanPrefsPromptBlock(params.mealPlanPrefs, params.lang)
    : "";

  const system = buildCompactSystemPrompt({
    lang: params.lang,
    mealsPerDay: params.mealsPerDay,
    targets: params.targets,
    dietBlock: [dietBlock, prefsBlock].filter(Boolean).join("\n"),
    bannedBlock,
    constraints: params.constraints,
    maxIngredients: OPENAI_MAX_INGREDIENTS_PER_MEAL,
  });

  const varietyHint = params.mealPlanPrefs?.variety === "varied"
    ? (params.lang === "de"
      ? " Jede Mahlzeit muss ein NEUES, unterschiedliches Gericht sein — keine Wiederholungen in der Woche."
      : params.lang === "fr"
        ? " Chaque repas doit être un plat NOUVEAU et différent — pas de répétitions dans la semaine."
        : " Every meal must be a NEW, distinct dish — no repeats within the week.")
    : "";

  const singleDay = params.singleDay;
  const dayCount = singleDay ? 1 : 7;

  const user = singleDay
    ? (params.lang === "de"
      ? `Erstelle NUR den Tag "${singleDay.name}" mit ${params.mealsPerDay} Mahlzeiten. Tagesziel exakt ~${params.targets.dailyProtein}P/${params.targets.dailyCarbs}C/${params.targets.dailyFat}F (${params.targets.dailyCalories} kcal).${varietyHint} Realistische Zutatenmengen und EUR-Preise.`
      : params.lang === "fr"
        ? `Crée UNIQUEMENT le jour "${singleDay.name}" avec ${params.mealsPerDay} repas. Objectif exact ~${params.targets.dailyProtein}P/${params.targets.dailyCarbs}C/${params.targets.dailyFat}F (${params.targets.dailyCalories} kcal).${varietyHint}`
        : `Create ONLY the day "${singleDay.name}" with ${params.mealsPerDay} meals. Exact daily target ~${params.targets.dailyProtein}P/${params.targets.dailyCarbs}C/${params.targets.dailyFat}F (${params.targets.dailyCalories} kcal).${varietyHint}`)
    : regen
    ? buildRegenerationUserPrompt(params.mealsPerDay, params.lang)
    : params.lang === "de"
      ? `Erstelle einen vollen 7-Tage-Plan (${params.mealsPerDay} Mahlzeiten/Tag). Jeden Tag andere Gerichte.${varietyHint} Normale Hausmannskost — nicht exotisch. GENAUE Nährwerte: protein/carbs/fat pro Mahlzeit basierend auf echten Lebensmitteldaten für die angegebenen Portionsgrößen. Portionsmengen so wählen, dass die Tagessumme das Makroziel trifft. Snacks 150–350 kcal, Hauptmahlzeiten 450–750 kcal. Allergene taggen. Zutatenmengen in g/ml/Stück, realistische EUR-Preise.`
      : params.lang === "fr"
        ? `Crée un plan 7 jours (${params.mealsPerDay} repas/jour). Plats différents chaque jour.${varietyHint} Cuisine maison selon les cuisines choisies. Varie les macros par repas. Tag allergènes. Quantités réalistes et prix EUR.`
        : `Create a full 7-day plan (${params.mealsPerDay} meals/day). Different dish names each day.${varietyHint} Everyday home cooking. ACCURATE macros: protein/carbs/fat per meal must match real nutritional data for the exact portions listed. Size portions so daily totals hit the macro target. Snacks 150–350 kcal, mains 450–750 kcal. Tag allergens. Realistic ingredient amounts (g/ml/pieces) and EUR prices.`;

  const openAiKey = getOpenAIKey();
  if (!openAiKey) throw new Error("OPENAI_API_KEY not configured");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_FETCH_TIMEOUT_MS);

  const baseTemp = regen ? 0.55 : 0.38;
  const temperature = params.mealPlanPrefs?.variety === "varied" ? Math.min(0.62, baseTemp + 0.12) : baseTemp;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: getOpenAIMealPlanModel(),
        temperature,
        max_tokens: OPENAI_PLAN_MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${system}\nReturn {"mealPlan":[${dayCount} day${dayCount === 1 ? "" : "s"} with ${params.mealsPerDay} meals each]}.`,
          },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(`OpenAI timeout after ${OPENAI_FETCH_TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const messageContent = data.choices?.[0]?.message?.content;
  const finishReason = data.choices?.[0]?.finish_reason;
  if (messageContent == null || messageContent === "") throw new Error("Empty OpenAI response");
  if (finishReason === "length") {
    console.warn("[MEAL-PLAN] OpenAI response truncated — attempting partial parse");
  }

  const raw = parseOpenAiMealPlanContent(messageContent, dayCount);

  return raw.map((day, i: number) => {
    const dayLabel = singleDay
      ? singleDay.name
      : String(day?.day || L.days[i] || `Day ${i + 1}`).trim();
    let meals = Array.isArray(day?.meals)
      ? day.meals.slice(0, params.mealsPerDay).map(normalizeMealStructure)
      : [];
    while (meals.length < params.mealsPerDay) {
      const slot = mealSlot(meals.length, params.mealsPerDay);
      const padName = params.lang === "de"
        ? (slot === "b" ? "Haferflocken mit Beeren" : slot === "m" ? "Hähnchen mit Reis" : "Obst mit Joghurt")
        : params.lang === "fr"
          ? (slot === "b" ? "Porridge baies" : slot === "m" ? "Poulet riz" : "Fruit yaourt")
          : (slot === "b" ? "Oatmeal berries" : slot === "m" ? "Chicken and rice" : "Fruit yogurt");
      meals.push(
        normalizeMealStructure({
          name: padName,
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
      day: dayLabel,
      meals,
    };
  });
}

export async function fetchAISingleDay(
  input: PlanInput,
  dayName: string,
  dayIndex: number,
): Promise<MealPlan> {
  return await callOpenAIOnce({
    mealsPerDay: input.mealsPerDay,
    targets: input.targets,
    constraints: input.constraints,
    lang: input.lang,
    banned: input.banned,
    isRegeneration: input.isRegeneration,
    priorDishes: input.priorDishes,
    prefs: input.prefs,
    mealPlanPrefs: input.mealPlanPrefs,
    singleDay: { name: dayName, index: dayIndex },
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
    mealPlanPrefs: input.mealPlanPrefs,
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
