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
      return json({ error: "premium_required", message: "Premium required." }, 403);
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
      typeof body.constraintPrompt === "string" ? body.constraintPrompt.trim() : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const hasOpenAiKey = Boolean(getOpenAIKey());
    console.log("[MEAL-PLAN] request", {
      hasOpenAiKey,
      isRegeneration: isRegeneration || priorDishes.length > 0,
      mealsPerDay,
      priorDishes: priorDishes.length,
    });

    const { plan, usedAi, repairAttempts } = await buildPlan({
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
      safetyCtx: createSafetyContext(allergies, prefs, other),
      isRegeneration: isRegeneration || priorDishes.length > 0,
      varietySeed,
      priorDishes,
    });

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
