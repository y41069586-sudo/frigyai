import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Lang = "de" | "en" | "fr";

function resolveLanguage(raw: unknown): Lang {
  return raw === "en" || raw === "fr" ? raw : "de";
}

const LANG_LABEL: Record<Lang, string> = {
  de: "German",
  en: "English",
  fr: "French",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return new Response(JSON.stringify({ error: "openai_key_missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const targetLanguage = resolveLanguage(body.targetLanguage);
    const mealPlan = Array.isArray(body.mealPlan) ? body.mealPlan : [];
    const shoppingList = Array.isArray(body.shoppingList) ? body.shoppingList : [];

    if (!mealPlan.length) {
      return new Response(JSON.stringify({ mealPlan: [], shoppingList }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      mealPlan: mealPlan.map((day: Record<string, unknown>) => ({
        day: day.day,
        meals: Array.isArray(day.meals)
          ? day.meals.map((meal: Record<string, unknown>) => ({
              name: meal.name,
              type: meal.type,
              ingredients: meal.ingredients,
            }))
          : [],
      })),
      shoppingList: shoppingList.map((item: Record<string, unknown>) => ({
        name: item.name,
        amount: item.amount,
        category: item.category,
      })),
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You translate meal plan labels to ${LANG_LABEL[targetLanguage]}. Return JSON only with keys "mealPlan" and "shoppingList". Keep the same array lengths and structure. Translate meal names, meal types, ingredient strings, shopping item names and categories. Do not change numbers, day keys, or add/remove items.`,
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${errText.slice(0, 200)}`);
    }

    const completion = await response.json();
    const rawContent = completion?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      throw new Error("Empty translation response");
    }

    const parsed = JSON.parse(rawContent);
    const translatedPlan = Array.isArray(parsed.mealPlan) ? parsed.mealPlan : mealPlan;
    const translatedList = Array.isArray(parsed.shoppingList) ? parsed.shoppingList : shoppingList;

    const mergedPlan = mealPlan.map((day: Record<string, unknown>, dayIndex: number) => {
      const translatedDay = translatedPlan[dayIndex] as Record<string, unknown> | undefined;
      const meals = Array.isArray(day.meals) ? day.meals : [];
      const translatedMeals = Array.isArray(translatedDay?.meals) ? translatedDay.meals : [];

      return {
        ...day,
        day: typeof translatedDay?.day === "string" ? translatedDay.day : day.day,
        meals: meals.map((meal: Record<string, unknown>, mealIndex: number) => {
          const translatedMeal = translatedMeals[mealIndex] as Record<string, unknown> | undefined;
          return {
            ...meal,
            name: typeof translatedMeal?.name === "string" ? translatedMeal.name : meal.name,
            type: typeof translatedMeal?.type === "string" ? translatedMeal.type : meal.type,
            ingredients: Array.isArray(translatedMeal?.ingredients)
              ? translatedMeal.ingredients
              : meal.ingredients,
          };
        }),
      };
    });

    const mergedList = shoppingList.map((item: Record<string, unknown>, index: number) => {
      const translatedItem = translatedList[index] as Record<string, unknown> | undefined;
      return {
        ...item,
        name: typeof translatedItem?.name === "string" ? translatedItem.name : item.name,
        amount: typeof translatedItem?.amount === "string" ? translatedItem.amount : item.amount,
        category: typeof translatedItem?.category === "string" ? translatedItem.category : item.category,
      };
    });

    return new Response(JSON.stringify({ mealPlan: mergedPlan, shoppingList: mergedList }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
