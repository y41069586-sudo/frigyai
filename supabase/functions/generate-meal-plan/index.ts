import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { isPremium, requireAuthUser, trackMealPlanUsage, type SupabaseClient } from "./auth.ts";
import { buildPlan } from "./buildPlan.ts";
import { buildConstraints, resolveLang } from "./constraints.ts";
import { getOpenAIKey } from "./constants.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { guaranteedSafeMinimalPlan } from "./fallbacks.ts";
import { corsHeaders, json } from "./http.ts";
import { reconcileTargets } from "./macros.ts";
import { finishPlan } from "./meals.ts";
import { resetOpenAiCallBudget } from "./openai.ts";
import { buildNoPorkConstraintBlock } from "./porkBan.ts";
import { scanMeta, shoppingList } from "./shopping.ts";
import type { MealPlan } from "./types.ts";
import { createSafetyContext } from "./validation.ts";
import { parsePriorMealsFromBody } from "./variety.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    resetOpenAiCallBudget();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) {
      return json({ error: "config_error", message: "Missing SUPABASE_URL" }, 500);
    }
    if (!serviceRoleKey) {
      return json({ error: "config_error", message: "Missing SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    }) as unknown as SupabaseClient;

    const authResult = await requireAuthUser(supabase, req.headers.get("Authorization"));
    if (authResult instanceof Response) return authResult;
    const { user: authUser, auth } = authResult;
    const userId = authUser.id;

    if (!(await isPremium(supabase, userId, authUser.email ?? null, auth))) {
      return json({
        error: "premium_required",
        message: "Premium erforderlich. Bitte Abo prüfen oder App neu starten.",
      }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json", message: "Body is not valid JSON" }, 400);
    }

    const mealsPerDay = Math.min(6, Math.max(3, Number(body.mealsPerDay) || 5));
    const { targets, warning: targetWarning, macroAuthority } = reconcileTargets({
      dailyCalories: Number(body.dailyCalories) || 2000,
      dailyProtein: Number(body.dailyProtein) || 150,
      dailyCarbs: Number(body.dailyCarbs) || 200,
      dailyFat: Number(body.dailyFat) || 65,
    });
    const allergies = Array.isArray(body.allergies) ? body.allergies.map(String) : [];
    const prefs = Array.isArray(body.dietaryPreferences) ? body.dietaryPreferences.map(String) : [];
    const goals = Array.isArray(body.healthGoals) ? body.healthGoals.map(String) : [];
    const other = typeof body.allergiesOther === "string" ? body.allergiesOther.trim() : "";
    const lang = resolveLang(body.language);
    const fridge = Array.isArray(body.fridgeIngredients) ? body.fridgeIngredients.map(String).filter(Boolean) : [];
    const banned = Array.isArray(body.previousMealNames) ? body.previousMealNames.map(String).filter(Boolean) : [];
    const priorDishes = parsePriorMealsFromBody(body.previousMeals, banned);
    const isRegeneration = body.isRegeneration === true || body.isRegeneration === "true";
    const varietySeed = typeof body.varietySeed === "string" ? body.varietySeed.trim() : "";
    const constraints = [
      buildConstraints(allergies, prefs, goals, other, lang),
      buildNoPorkConstraintBlock(lang),
      typeof body.constraintPrompt === "string" ? body.constraintPrompt.trim() : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const safetyCtx = createSafetyContext(allergies, prefs, other);
    const planInput = {
      mealsPerDay,
      targets,
      prefs,
      allergies,
      other,
      goals,
      lang,
      fridge,
      banned,
      constraints,
      safetyCtx,
      isRegeneration: isRegeneration || priorDishes.length > 0,
      varietySeed,
      priorDishes,
    };

    const hasOpenAiKey = Boolean(getOpenAIKey());
    console.log("[MEAL-PLAN] request", {
      hasOpenAiKey,
      isRegeneration: planInput.isRegeneration,
      mealsPerDay,
      priorDishes: priorDishes.length,
    });

    let plan: MealPlan;
    let usedAi = false;
    let repairAttempts = 0;

    try {
      const built = await buildPlan(planInput);
      plan = built.plan;
      usedAi = built.usedAi;
      repairAttempts = built.repairAttempts;
    } catch (buildErr) {
      const msg = buildErr instanceof Error ? buildErr.message : String(buildErr);
      console.error("[MEAL-PLAN] buildPlan failed — safe fallback:", msg);
      plan = guaranteedSafeMinimalPlan({ mealsPerDay, lang });
      plan = finishPlan(plan, targets, mealsPerDay, lang) ?? plan;
      usedAi = false;
      repairAttempts = 0;
    }

    if (!Array.isArray(plan) || plan.length < 7) {
      console.warn("[MEAL-PLAN] plan too short — rebuilding fallback");
      const bannedSet = new Set(banned.map((n) => n.toLowerCase().trim()).filter(Boolean));
      const fallback = generateFallbackDraft(planInput, bannedSet);
      plan = finishPlan(fallback, targets, mealsPerDay, lang) ??
        guaranteedSafeMinimalPlan({ mealsPerDay, lang });
      plan = finishPlan(plan, targets, mealsPerDay, lang) ?? plan;
      usedAi = false;
    }

    const list = shoppingList(plan, fridge);
    const meta = scanMeta(plan, fridge, list);

    await trackMealPlanUsage(supabase, userId);

    return json({
      mealPlan: plan,
      shoppingList: list,
      scanMeta: meta,
      generatedWithAi: usedAi,
      appliedTargets: targets,
      macroAuthority,
      ...(targetWarning ? { targetWarning } : {}),
      ...(repairAttempts > 0 ? { repairAttempts } : {}),
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[MEAL-PLAN]", message);
    return json({ error: "meal_plan_generation_failed", message }, 500);
  }
});
