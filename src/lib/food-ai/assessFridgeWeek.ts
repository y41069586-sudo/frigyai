import { supabase } from "@/integrations/supabase/client";

export interface FridgeWeekAssessment {
  sufficient: boolean;
  reason: string;
  /** true wenn die Edge-Function geantwortet hat (nicht nur Heuristik) */
  fromApi: boolean;
}

const PROD_UNAVAILABLE_REASON =
  "Die Kühlschrank-Analyse ist gerade nicht verfügbar. Bitte versuche es erneut.";

/**
 * Prüft per OpenAI (Edge Function), ob Kühlschrank-Zutaten für eine volle Woche reichen.
 * In Production keine irreführende Heuristik — nur echte API-Antwort oder Fehler.
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
      if (import.meta.env.PROD) {
        return { sufficient: false, reason: PROD_UNAVAILABLE_REASON, fromApi: false };
      }
      const { assessFridgeWeekHeuristic } = await import("./mock");
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

  if (import.meta.env.PROD) {
    return { sufficient: false, reason: PROD_UNAVAILABLE_REASON, fromApi: false };
  }

  const { assessFridgeWeekHeuristic } = await import("./mock");
  const h = assessFridgeWeekHeuristic(normalized);
  return { ...h, fromApi: false };
}
