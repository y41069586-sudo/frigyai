import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionError";
import type { Language } from "@/contexts/LanguageContext";

export type MealPlanDay = {
  day?: string;
  meals?: Array<{
    name?: string;
    type?: string;
    ingredients?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type ShoppingListItem = {
  name?: string;
  amount?: string;
  category?: string;
  [key: string]: unknown;
};

export async function translateMealPlanContent(
  mealPlan: MealPlanDay[],
  shoppingList: ShoppingListItem[],
  targetLanguage: Language,
  accessToken?: string | null,
): Promise<{ mealPlan: MealPlanDay[]; shoppingList: ShoppingListItem[] } | null> {
  if (!mealPlan.length) return null;

  const { data, error } = await supabase.functions.invoke("translate-meal-plan", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: {
      mealPlan,
      shoppingList,
      targetLanguage,
    },
  });

  if (error) {
    console.warn("[translate-meal-plan]", await getEdgeFunctionErrorMessage(error, data));
    return null;
  }

  const nextPlan = Array.isArray((data as { mealPlan?: unknown })?.mealPlan)
    ? ((data as { mealPlan: MealPlanDay[] }).mealPlan)
    : null;
  if (!nextPlan?.length) return null;

  const nextList = Array.isArray((data as { shoppingList?: unknown })?.shoppingList)
    ? ((data as { shoppingList: ShoppingListItem[] }).shoppingList)
    : shoppingList;

  return { mealPlan: nextPlan, shoppingList: nextList };
}
