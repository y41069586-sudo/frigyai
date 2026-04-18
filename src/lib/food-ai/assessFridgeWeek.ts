import { supabase } from "@/integrations/supabase/client";
import { assessFridgeWeekHeuristic } from "./mock";

export interface FridgeWeekAssessment {
  sufficient: boolean;
  reason: string;
  /** true wenn die Edge-Function geantwortet hat (nicht nur Heuristik) */
  fromApi: boolean;
}

/**
 * Prüft per OpenAI (Edge Function), ob Kühlschrank-Zutaten für eine volle Woche reichen.
 * Fällt bei Fehler auf eine konservative Heuristik zurück.
 */
export async function assessFridgeForWeek(ingredients: string[]): Promise<FridgeWeekAssessment> {
  const normalized = [...new Set(ingredients.map((i) => i.trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return { sufficient: false, reason: "Keine Zutaten erkannt.", fromApi: false };
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      sufficient?: boolean;
      reason?: string;
      error?: string;
    }>("assess-fridge-for-week", {
      body: { ingredients: normalized },
    });

    if (error) {
      console.warn("[assessFridgeForWeek] invoke error", error);
      const h = assessFridgeWeekHeuristic(normalized);
      return { ...h, fromApi: false };
    }

    if (data && typeof data.sufficient === "boolean") {
      return {
        sufficient: data.sufficient,
        reason: typeof data.reason === "string" ? data.reason : "",
        fromApi: true,
      };
    }
  } catch (e) {
    console.warn("[assessFridgeForWeek]", e);
  }

  const h = assessFridgeWeekHeuristic(normalized);
  return { ...h, fromApi: false };
}
