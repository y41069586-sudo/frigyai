import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeIngredientKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLERGY_PATTERNS: Record<string, RegExp> = {
  gluten: /(brot|brötchen|nudel|pasta|spaghetti|paniermehl|couscous|bulgur|lasagne|pizza|gnocchi|weizen|dinkel|rogge|gerste|wrap|mehl|baguette|toast|pizzateig|panko|semmel)/i,
  wheat: /(brot|brötchen|nudel|pasta|spaghetti|paniermehl|couscous|bulgur|lasagne|pizza|gnocchi|weizen|dinkel|rogge|gerste|wrap|mehl|baguette|toast|pizzateig|panko|semmel)/i,
  lactose: /(milch|käse|joghurt|quark|sahne|butter|mozzarella|parmesan|frischkäse|griechisch|emmental|cheddar|ricotta|schmand|crème|crème fraîche)/i,
  milk: /(milch|käse|joghurt|quark|sahne|butter|mozzarella|parmesan|frischkäse|griechisch|emmental|cheddar|ricotta|schmand|crème|crème fraîche)/i,
  nuts: /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|müsli|musliriegel)/i,
  peanuts: /(erdnuss|erdnüsse|peanut|peanuts|erdnussbutter|erdnussmus)/i,
  treeNuts: /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|nussmus|mandelmilch)/i,
  "tree-nuts": /(nuss|nüsse|mandel|haselnuss|walnuss|cashew|pistaz|paranuss|macadam|pekannuss|nussmus|mandelmilch)/i,
  soy: /(soja|soy|tofu|tempeh|edamame|sojasauce)/i,
  eggs: /(ei\b|eier|omelett|rührei|mayonnaise|mayo\b)/i,
  egg: /(ei\b|eier|omelett|rührei|mayonnaise|mayo\b)/i,
  fish: /(fisch|lachs|thunfisch|forelle|seelachs|kabeljau|sardine|makrele)/i,
  shellfish: /(garnele|garnelen|shrimp|krabbe|krebs|hummer|muschel|auster|scampi)/i,
};

function mealTextBlob(meal: any): string {
  return `${meal?.name ?? ""} ${(meal?.ingredients ?? []).map((i: any) => i?.name ?? "").join(" ")}`.toLowerCase();
}

function findSafetyViolations(mealPlan: any[], allergies: string[], dietaryPreferences: string[], allergiesOther: string) {
  const unsafe: string[] = [];
  const customTerms = String(allergiesOther || "")
    .toLowerCase()
    .split(/[,;/\n]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);

  for (const day of mealPlan || []) {
    for (const meal of day.meals || []) {
      const blob = mealTextBlob(meal);
      const violations: string[] = [];
      for (const allergy of allergies || []) {
        if (!allergy || allergy === "none" || allergy === "other") continue;
        if (ALLERGY_PATTERNS[allergy]?.test(blob)) violations.push(allergy);
      }
      if (customTerms.some((term) => blob.includes(term))) violations.push("other");
      if (dietaryPreferences?.includes("vegan") && /(milch|käse|ei|eier|joghurt|quark|butter|sahne|honig|fleisch|hähnchen|lachs|fisch|thunfisch|wurst|hack|speck|schinken|schnitzel|schwein|pute)/i.test(blob)) violations.push("vegan");
      if (dietaryPreferences?.includes("vegetarian") && /(hackfleisch|hähnchen|pute|schwein|fleisch|wurst|schnitzel|schinken|steak|speck|salami|bacon|currywurst|bratwurst|frikadell|lachs|thunfisch|fisch)/i.test(blob)) violations.push("vegetarian");
      const highCarb = /(nudel|pasta|spaghetti|brot|brötchen|reis|hafer|müsli|kartoffel|pommes|paniermehl|honig|baguette|lasagne)/i;
      if ((dietaryPreferences?.includes("keto") || dietaryPreferences?.includes("low-carb")) && highCarb.test(blob)) {
        violations.push("low-carb");
      }
      if (dietaryPreferences?.includes("paleo") && /(nudel|pasta|brot|reis|hafer|müsli|bohnen|linsen|milch|käse|joghurt|quark|sahne|paniermehl)/i.test(blob)) {
        violations.push("paleo");
      }
      if (violations.length) unsafe.push(`${day.day}: ${meal.name} (${[...new Set(violations)].join(", ")})`);
    }
  }
  return unsafe;
}

function stemToken(token: string): string {
  return token
    .replace(/(chen|lein)$/i, "")
    .replace(/(en|er|e|n|s)$/i, "")
    .trim();
}

function tokenizeIngredient(name: string): string[] {
  return normalizeIngredientKey(name)
    .split(" ")
    .map((t) => stemToken(t))
    .filter((t) => t.length >= 3);
}

function fridgeCoversIngredient(ingredientName: string, fridge: string[]): boolean {
  const n = normalizeIngredientKey(ingredientName);
  const nt = tokenizeIngredient(ingredientName);
  if (!n) return false;
  for (const raw of fridge) {
    const f = normalizeIngredientKey(raw);
    const ft = tokenizeIngredient(raw);
    if (!f) continue;
    if (n === f) return true;
    if (n.includes(f) || f.includes(n)) return true;
    if (ft.some((t) => nt.includes(t))) return true;
  }
  return false;
}

function generateGapShoppingList(mealPlan: any[], fridgeIngredients: string[]) {
  const map = new Map<string, { name: string; amounts: string[]; price: number }>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;

        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;

        const price = typeof ing.price === "number" ? ing.price : Number(ing.price) || 0;
        const amount = String(ing.amount || "").trim() || "—";

        if (map.has(key)) {
          const ex = map.get(key)!;
          ex.amounts.push(amount);
          ex.price += price;
        } else {
          map.set(key, {
            name: String(ing.name).trim(),
            amounts: [amount],
            price,
          });
        }
      }
    }
  }

  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: [...new Set(v.amounts)].join(" · "),
    price: Math.round(v.price * 100) / 100,
  }));
}

function computeScanMeta(mealPlan: any[], fridgeIngredients: string[], gapList: any[]) {
  const uniqueRecipe = new Set<string>();
  const covered = new Set<string>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;
        uniqueRecipe.add(key);
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) covered.add(key);
      }
    }
  }

  const percentHave =
    uniqueRecipe.size === 0 ? 0 : Math.round((covered.size / uniqueRecipe.size) * 100);

  let saved = 0;
  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        if (!fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;
        const p = typeof ing.price === "number" ? ing.price : Number(ing.price) || 0;
        saved += p;
      }
    }
  }

  const gapTotal = gapList.reduce((s: number, g: any) => s + (g.price || 0), 0);
  const allTotal = saved + gapTotal;
  const eurosSaved = allTotal > 0 ? Math.round(saved * 10) / 10 : 0;

  return { percentIngredientsFromFridge: percentHave, estimatedEurosSaved: eurosSaved };
}

const MACRO_KCAL_TOLERANCE = 50;

function macroKcal(p: number, c: number, f: number) {
  return p * 4 + c * 4 + f * 9;
}

function sumMeals(meals: any[]) {
  return meals.reduce(
    (a: any, m: any) => ({
      calories: a.calories + (Number(m.calories) || 0),
      protein: a.protein + (Number(m.protein) || 0),
      carbs: a.carbs + (Number(m.carbs) || 0),
      fat: a.fat + (Number(m.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function normalizeMeal(m: any) {
  const protein = Math.max(0, Math.round(Number(m.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(m.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(m.fat) || 0));
  const fromMacros = macroKcal(protein, carbs, fat);
  const stated = Number(m.calories) || 0;
  const calories =
    stated > 0 && Math.abs(stated - fromMacros) <= MACRO_KCAL_TOLERANCE
      ? Math.round(stated)
      : Math.max(50, Math.round(fromMacros));
  return { ...m, protein, carbs, fat, calories };
}

function harmonizeDailyTargets(targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  const implied = macroKcal(targets.dailyProtein, targets.dailyCarbs, targets.dailyFat);
  const diff = targets.dailyCalories - implied;
  if (Math.abs(diff) <= 2) return { ...targets, dailyCalories: implied };
  const dailyCarbs = Math.max(0, targets.dailyCarbs + Math.round(diff / 4));
  return {
    ...targets,
    dailyCarbs,
    dailyCalories: macroKcal(targets.dailyProtein, dailyCarbs, targets.dailyFat),
  };
}

function recalcMeal(m: any) {
  const protein = Math.max(0, Math.round(Number(m.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(m.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(m.fat) || 0));
  return { ...m, protein, carbs, fat, calories: Math.max(50, Math.round(macroKcal(protein, carbs, fat))) };
}

function balanceDayCalories(meals: any[], targetCalories: number) {
  for (let pass = 0; pass < 400; pass++) {
    const total = sumMeals(meals).calories;
    const diff = targetCalories - total;
    if (diff === 0) break;
    const idx = pass % meals.length;
    const m = meals[idx];
    if (diff > 0) {
      if (Math.abs(diff) >= 9) m.fat = (Number(m.fat) || 0) + 1;
      else m.carbs = (Number(m.carbs) || 0) + 1;
    } else {
      if (Math.abs(diff) >= 9 && (Number(m.fat) || 0) > 0) m.fat = (Number(m.fat) || 0) - 1;
      else if ((Number(m.carbs) || 0) > 0) m.carbs = (Number(m.carbs) || 0) - 1;
      else if ((Number(m.protein) || 0) > 0) m.protein = (Number(m.protein) || 0) - 1;
    }
    meals[idx] = recalcMeal(m);
  }
}

function syncDayToTargets(day: any, rawTargets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  const targets = harmonizeDailyTargets(rawTargets);
  let meals = (day.meals || []).map((m: any) => recalcMeal(normalizeMeal(m)));
  if (!meals.length) return day;

  const initial = sumMeals(meals);
  const fp = targets.dailyProtein / (initial.protein || 1);
  const fcb = targets.dailyCarbs / (initial.carbs || 1);
  const ff = targets.dailyFat / (initial.fat || 1);

  meals = meals.map((m: any) =>
    recalcMeal({
      ...m,
      protein: Math.max(0, Math.round((m.protein || 0) * fp)),
      carbs: Math.max(0, Math.round((m.carbs || 0) * fcb)),
      fat: Math.max(0, Math.round((m.fat || 0) * ff)),
    }),
  );

  const lastIdx = meals.length - 1;
  const beforeLast = sumMeals(meals.slice(0, lastIdx));
  meals[lastIdx] = recalcMeal({
    ...meals[lastIdx],
    protein: Math.max(0, targets.dailyProtein - beforeLast.protein),
    carbs: Math.max(0, targets.dailyCarbs - beforeLast.carbs),
    fat: Math.max(0, targets.dailyFat - beforeLast.fat),
  });

  balanceDayCalories(meals, targets.dailyCalories);
  return { ...day, meals };
}

function syncMealPlanToTargets(mealPlan: any[], targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  return mealPlan.map((day) => syncDayToTargets(day, targets));
}

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split("T")[0];
};

async function resolvePremium(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  const { data: cacheData } = await supabase
    .from("subscription_cache")
    .select("subscribed, subscription_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (cacheData?.subscribed) {
    const active = !cacheData.subscription_end || new Date(cacheData.subscription_end) > new Date();
    if (active) return true;
  }

  if (email?.toLowerCase() === "yousef0089mohamed@gmail.com") return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader === "Bearer null" || authHeader === "Bearer undefined") {
      return new Response(JSON.stringify({ error: "premium_required", message: "Anmeldung erforderlich." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "premium_required", message: "Ungültige Sitzung." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const isPremium = await resolvePremium(supabase, userId, userData.user.email);
    if (!isPremium) {
      return new Response(JSON.stringify({ error: "premium_required", message: "Premium erforderlich." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const constraintPrompt =
      typeof body.constraintPrompt === "string" ? body.constraintPrompt.trim() : "";
    const mealsPerDay = Math.min(6, Math.max(3, Number(body.mealsPerDay) || 5));
    const dailyCalories = Number(body.dailyCalories) || 2000;
    const dailyProtein = Number(body.dailyProtein) || Math.round(dailyCalories * 0.075 / 4);
    const dailyCarbs = Number(body.dailyCarbs) || Math.round(dailyCalories * 0.45 / 4);
    const dailyFat = Number(body.dailyFat) || Math.round(dailyCalories * 0.28 / 9);
    const fridgeIngredients = Array.isArray(body.fridgeIngredients)
      ? body.fridgeIngredients.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const allergies = Array.isArray(body.allergies)
      ? body.allergies.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const dietaryPreferences = Array.isArray(body.dietaryPreferences)
      ? body.dietaryPreferences.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const allergiesOther = typeof body.allergiesOther === "string" ? body.allergiesOther.trim() : "";
    const isRegeneration = body.isRegeneration === true;
    const varietySeed = typeof body.varietySeed === "string" ? body.varietySeed : String(Date.now());

    const macroTargets = harmonizeDailyTargets({
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
    });

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY fehlt auf der Edge Function.",
          message: "Die KI-Wochenplanfunktion ist aktuell nicht konfiguriert.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const fridgeHint =
      fridgeIngredients.length > 0
        ? `\n\nKühlschrank (bereits vorhanden – priorisiere diese Zutaten, darfst aber beliebig weitere ergänzen):\n${fridgeIngredients.join(", ")}`
        : "\n\nKein Kühlschrankscan vorhanden: Erstelle trotzdem einen vollständigen Wochenplan frei aus passenden Zutaten. Die Einkaufsliste enthält danach alle benötigten Zutaten, bis ein Kühlschrankscan vorhandene Zutaten abzieht.";

    const systemPrompt = `Du bist ein deutscher Ernährungsexperte und planst realistische Mahlzeiten.

Erstelle einen VOLLSTÄNDIGEN Wochenplan – niemals leere Tage oder unvollständige Pläne.

REGELN:
- Genau 7 Tage (Montag–Sonntag)
- Pro Tag genau ${mealsPerDay} Mahlzeiten
- Einfache Hausmannskost, keine exotischen Zutaten
- Der Plan darf und soll auch OHNE Kühlschrankscan erstellt werden
- Nutze Kühlschrankzutaten nur wenn vorhanden und sinnvoll; ergänze fehlende Zutaten frei für Makroziele und Abwechslung
- Nährwerte müssen realistisch sein (keine Fantasiewerte)
- Kalorien jeder Mahlzeit MÜSSEN exakt zu den Makros passen: kcal = 4*Protein + 4*Kohlenhydrate + 9*Fett (max. ±50 kcal Abweichung — sonst ungültig)
- Gib realistische, messbare Makrowerte an — keine Schätzungen oder Fantasiewerte
${
      constraintPrompt
        ? "- Allergien, Ernährungsziele (z. B. Keto, Vegan, Low-Carb) und weitere Onboarding-Vorgaben unten sind ABSOLUT bindend. Wenn z. B. Eier verboten sind, darf kein Ei, Rührei, Omelett, Mayonnaise oder eihaltiges Gericht vorkommen."
        : ""
    }

PRO TAG müssen die Summen ALLER Mahlzeiten EXAKT diesen Zielen entsprechen:
- Kalorien: ${macroTargets.dailyCalories} kcal (Summe = 4×Protein + 4×KH + 9×Fett)
- Protein: ${macroTargets.dailyProtein} g
- Kohlenhydrate: ${macroTargets.dailyCarbs} g
- Fett: ${macroTargets.dailyFat} g
${isRegeneration ? `\nNEUGENERIERUNG (${varietySeed}): JEDES einzelne Gericht muss komplett anders sein als in typischen Standardplänen. Keine Wiederholung von Gerichten innerhalb der Woche. Variiere Küche, Zutaten und Zubereitung maximal.` : ""}

Jede Mahlzeit MUSS enthalten:
type, name, calories, protein, carbs, fat, prepTime, ingredients, instructions

ingredients MUSS pro Zutat enthalten:
name, amount (mit Einheit), price (geschätzter Preis in EUR für diese Menge)

instructions: Array mit GENAU 10–14 Strings – Kochanleitung für absolute Anfänger, die jeder Schritt für Schritt nachkochen kann.
PFLICHT-Format JEDES Elements: "[X Min | Phase] Ausführliche Handlung."
- Phase nur: Vorbereitung | Kochen | Garen | Pause | Anrichten
- X = geschätzte aktive Zeit für diesen Schritt (Minuten als Zahl)
- Beschreibe konkret: welches Gerät (Topf/Pfanne/Ofen), Hitze (z. B. mittlere Stufe, 180 °C), Mengen, wann rühren/wenden, wie Garzustand erkennen (Farbe, Konsistenz, Kerntemperatur)
- Parallelarbeit erwähnen (z. B. während Nudeln kochen Soße vorbereiten)
- Optional am Ende eines Schritts: "Tipp: …" für typische Fehler
- Summe der Minuten in [] soll ungefähr prepTime entsprechen (±3 Min)
- Erster Schritt: Arbeitsplatz vorbereiten; letzter Schritt: Anrichten und Servieren mit Portionierung
- Keine Ein-Wort-Schritte, keine vagen Formulierungen wie "nach Belieben garen"

Antwort NUR als JSON:

{
 "mealPlan":[
  {
   "day":"Montag",
   "meals":[]
  }
 ]
}`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: isRegeneration ? 0.62 : 0.42,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                `Erstelle einen vollständigen 7-Tage-Plan mit ${mealsPerDay} Mahlzeiten pro Tag.`,
                `Tagesziele: ${macroTargets.dailyCalories} kcal, Protein ${macroTargets.dailyProtein}g, Kohlenhydrate ${macroTargets.dailyCarbs}g, Fett ${macroTargets.dailyFat}g.`,
                isRegeneration
                  ? `Plan-ID ${varietySeed}: Erstelle einen komplett neuen Wochenplan — alle 35 Mahlzeiten mit anderen Gerichten als üblich.`
                  : "",
                fridgeHint,
                constraintPrompt
                  ? `\n\n--- Nutzer-Vorgaben (verbindlich) ---\n${constraintPrompt}`
                  : "",
              ].join("\n"),
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let parsed: { mealPlan?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON from OpenAI");
    }
    let mealPlan = parsed.mealPlan;

    if (!Array.isArray(mealPlan) || mealPlan.length === 0) {
      throw new Error("Empty meal plan");
    }

    mealPlan = syncMealPlanToTargets(mealPlan, macroTargets);
    const unsafeMeals = findSafetyViolations(mealPlan, allergies, dietaryPreferences, allergiesOther);
    if (unsafeMeals.length > 0) {
      throw new Error(`Allergy safety validation failed: ${unsafeMeals.slice(0, 5).join("; ")}`);
    }

    const shoppingList = generateGapShoppingList(mealPlan, fridgeIngredients);
    const scanMeta = computeScanMeta(mealPlan, fridgeIngredients, shoppingList);

    const weekStart = getWeekStart();
    const { data: usageRow } = await supabase
      .from("meal_plan_usage")
      .select("generation_count")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();

    const nextCount = (usageRow?.generation_count || 0) + 1;
    if (usageRow) {
      await supabase
        .from("meal_plan_usage")
        .update({ generation_count: nextCount, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("week_start", weekStart);
    } else {
      await supabase.from("meal_plan_usage").insert({
        user_id: userId,
        week_start: weekStart,
        generation_count: 1,
      });
    }

    return new Response(
      JSON.stringify({
        mealPlan,
        shoppingList,
        scanMeta,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
