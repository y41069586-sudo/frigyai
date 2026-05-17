declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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

function reconcileDayMacros(day: any, targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  const meals = day.meals || [];
  let sumC = 0;
  let sumP = 0;
  let sumCb = 0;
  let sumF = 0;
  for (const m of meals) {
    sumC += m.calories || 0;
    sumP += m.protein || 0;
    sumCb += m.carbs || 0;
    sumF += m.fat || 0;
  }
  if (meals.length === 0) return day;
  const fc = targets.dailyCalories / (sumC || 1);
  const fp = targets.dailyProtein / (sumP || 1);
  const fcb = targets.dailyCarbs / (sumCb || 1);
  const ff = targets.dailyFat / (sumF || 1);

  return {
    ...day,
    meals: meals.map((m: any) => ({
      ...m,
      calories: Math.round((m.calories || 0) * fc),
      protein: Math.round((m.protein || 0) * fp),
      carbs: Math.round((m.carbs || 0) * fcb),
      fat: Math.round((m.fat || 0) * ff),
    })),
  };
}

function reconcileMealPlanMacros(mealPlan: any[], targets: {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}) {
  return mealPlan.map((day) => reconcileDayMacros(day, targets));
}

function enforceMacroEnergyConsistency(mealPlan: any[]) {
  return mealPlan.map((day: any) => ({
    ...day,
    meals: (day.meals || []).map((m: any) => {
      const protein = Math.max(0, Number(m.protein) || 0);
      const carbs = Math.max(0, Number(m.carbs) || 0);
      const fat = Math.max(0, Number(m.fat) || 0);
      const kcalFromMacros = protein * 4 + carbs * 4 + fat * 9;
      // Keep calories honest: derive from macros to avoid impossible combinations.
      const calories = Math.max(50, Math.round(kcalFromMacros));
      return {
        ...m,
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        calories,
      };
    }),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
- Kalorien jeder Mahlzeit müssen zu den Makros passen: kcal ≈ 4*Protein + 4*Kohlenhydrate + 9*Fett (max. ±10% Abweichung)
${
      constraintPrompt
        ? `- Allergien, Unverträglichkeiten und Ernährungsform unten sind ABSOLUT bindend. Wenn z. B. Eier verboten sind, darf kein Ei, Rührei, Omelett, Mayonnaise oder eihaltiges Gericht vorkommen.`
        : ""
    }

PRO TAG müssen die Summen ALLER Mahlzeiten diesen Zielen entsprechen (Toleranz ±8% vor Nachbearbeitung):
- Kalorien: ca. ${dailyCalories} kcal
- Protein: ca. ${dailyProtein} g
- Kohlenhydrate: ca. ${dailyCarbs} g
- Fett: ca. ${dailyFat} g

Jede Mahlzeit MUSS enthalten:
type, name, calories, protein, carbs, fat, prepTime, ingredients, instructions

ingredients MUSS pro Zutat enthalten:
name, amount (mit Einheit), price (geschätzter Preis in EUR für diese Menge)

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
          temperature: 0.35,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                `Erstelle einen vollständigen 7-Tage-Plan mit ${mealsPerDay} Mahlzeiten pro Tag.`,
                `Tagesziele: ${dailyCalories} kcal, Protein ${dailyProtein}g, Kohlenhydrate ${dailyCarbs}g, Fett ${dailyFat}g.`,
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let parsed = JSON.parse(content);
    let mealPlan = parsed.mealPlan;

    if (!Array.isArray(mealPlan) || mealPlan.length === 0) {
      throw new Error("Empty meal plan");
    }

    mealPlan = reconcileMealPlanMacros(mealPlan, {
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
    });
    mealPlan = enforceMacroEnergyConsistency(mealPlan);

    const shoppingList = generateGapShoppingList(mealPlan, fridgeIngredients);
    const scanMeta = computeScanMeta(mealPlan, fridgeIngredients, shoppingList);

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
    return new Response(
      JSON.stringify({
        error: error.message,
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
