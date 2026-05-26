import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const MAX_BASE64_SIZE = 6_700_000;
const FOOD_NOT_FOUND = "Essen nicht gefunden";
const AI_MACRO_KCAL_TOLERANCE = 35;
const MAX_AI_CALORIES = 1600;
const MAX_AI_PROTEIN = 120;
const MAX_AI_CARBS = 220;
const MAX_AI_FAT = 120;

const requestSchema = z
  .object({
    food: z.string().min(1).max(500).optional(),
    imageBase64: z.string().max(MAX_BASE64_SIZE).optional(),
  })
  .refine((data) => data.food || data.imageBase64, {
    message: "Either 'food' or 'imageBase64' must be provided",
  });

// --- Open Food Facts (inlined for Supabase bundle: only index.ts is deployed) ---

type OffFoodResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
  source: "open_food_facts";
  barcode?: string;
  brand?: string;
};

function offParseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function offKcalPer100g(nutriments: Record<string, unknown>): number {
  const kcal = offParseNumber(nutriments["energy-kcal_100g"]) ||
    offParseNumber(nutriments["energy-kcal"]) ||
    offParseNumber(nutriments["energy-kcal_serving"]);
  if (kcal > 0) return kcal;
  const kj = offParseNumber(nutriments["energy_100g"]) || offParseNumber(nutriments["energy"]);
  if (kj > 0) return kj / 4.184;
  return 0;
}

function offNormalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function offNameScore(productName: string, query: string): number {
  const name = productName.toLowerCase();
  const q = offNormalizeQuery(query);
  if (!q) return 0;
  if (name === q) return 100;
  if (name.startsWith(q) || name.includes(` ${q}`)) return 80;
  if (name.includes(q)) return 60;
  const qTokens = q.split(" ").filter(Boolean);
  const matched = qTokens.filter((t) => name.includes(t)).length;
  return (matched / qTokens.length) * 50;
}

function mapOffProductToFood(
  product: Record<string, unknown>,
  query: string,
): OffFoodResult | null {
  const nutriments = (product.nutriments as Record<string, unknown>) || {};
  const kcal100 = offKcalPer100g(nutriments);
  if (kcal100 <= 0 || kcal100 > 900) return null;

  const proteins100 = offParseNumber(nutriments.proteins_100g);
  const carbs100 = offParseNumber(nutriments.carbohydrates_100g);
  const fat100 = offParseNumber(nutriments.fat_100g);

  const rawName =
    (product.product_name_de as string) ||
    (product.product_name as string) ||
    query.trim();
  const name = rawName.trim();
  if (name.length < 2) return null;

  let servingQty = offParseNumber(product.serving_quantity);
  if (servingQty <= 0 || servingQty > 2000) servingQty = 100;

  const multiplier = servingQty / 100;
  const portion =
    (product.serving_size as string)?.trim() ||
    (servingQty === 100 ? "100g" : `${servingQty}g`);

  const displayName =
    servingQty !== 100 && !name.toLowerCase().includes(String(servingQty))
      ? `${name} (${portion})`
      : name;

  return {
    name: displayName,
    calories: Math.max(1, Math.round(kcal100 * multiplier)),
    protein: Math.max(0, Math.round(proteins100 * multiplier)),
    carbs: Math.max(0, Math.round(carbs100 * multiplier)),
    fat: Math.max(0, Math.round(fat100 * multiplier)),
    portion,
    source: "open_food_facts",
    barcode: product.code ? String(product.code) : undefined,
    brand: product.brands ? String(product.brands).split(",")[0]?.trim() : undefined,
  };
}

async function searchOpenFoodFacts(query: string): Promise<OffFoodResult | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const params = new URLSearchParams({
    search_terms: trimmed,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "12",
    lc: "de",
    fields:
      "code,product_name,product_name_de,nutriments,serving_size,serving_quantity,brands,nova_group",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params}`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;

    const data = await res.json();
    const products = (data.products || []) as Record<string, unknown>[];

    let best: { food: OffFoodResult; score: number } | null = null;

    for (const product of products) {
      const mapped = mapOffProductToFood(product, trimmed);
      if (!mapped) continue;

      const productName =
        (product.product_name_de as string) ||
        (product.product_name as string) ||
        "";
      const score = offNameScore(productName, trimmed) + (mapped.calories > 0 ? 10 : 0);

      if (!best || score > best.score) {
        best = { food: mapped, score };
      }
    }

    return best?.food ?? null;
  } catch (err) {
    console.warn("[OFF] Search failed:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// --- end Open Food Facts ---

async function uploadFoodPhoto(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  imageBase64: string,
): Promise<string | null> {
  try {
    const imageData = base64Decode(imageBase64);
    const fileName = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("food-photos")
      .upload(fileName, imageData, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("[ANALYZE-FOOD] Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("food-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error("[ANALYZE-FOOD] Photo upload failed:", err);
    return null;
  }
}

function notFoundResponse() {
  return successResponse({ error: FOOD_NOT_FOUND, not_found: true });
}

function successResponse(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

function macroCalories(protein: number, carbs: number, fat: number) {
  return protein * 4 + carbs * 4 + fat * 9;
}

function normalizeAiFoodEstimate(parsed: Record<string, unknown>) {
  const name = String(parsed.name || "").trim();
  if (!name) return null;

  const protein = Math.max(0, Math.round(Number(parsed.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(parsed.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(parsed.fat) || 0));
  const statedCalories = Math.max(0, Math.round(Number(parsed.calories) || 0));
  const derivedCalories = Math.max(0, Math.round(macroCalories(protein, carbs, fat)));

  if (protein + carbs + fat <= 0) {
    return null;
  }

  if (
    protein > MAX_AI_PROTEIN ||
    carbs > MAX_AI_CARBS ||
    fat > MAX_AI_FAT ||
    derivedCalories > MAX_AI_CALORIES
  ) {
    return null;
  }

  if (
    statedCalories > 0 &&
    Math.abs(statedCalories - derivedCalories) > AI_MACRO_KCAL_TOLERANCE
  ) {
    console.warn(
      `[ANALYZE-FOOD] Replacing inconsistent AI calories for "${name}": stated=${statedCalories}, derived=${derivedCalories}`,
    );
  }

  return {
    found: true,
    name,
    calories: derivedCalories,
    protein,
    carbs,
    fat,
    portion: parsed.portion ? String(parsed.portion).trim() : undefined,
    source: "ai",
  };
}

async function analyzeWithOpenAI(
  apiKey: string,
  food: string | undefined,
  imageBase64: string | undefined,
): Promise<Record<string, unknown> | null> {
  const systemPrompt = `Du bist Ernährungs-Assistent. Antworte NUR mit JSON, kein anderer Text.

Wenn du das Essen als echtes Lebensmittel mit verlässlichen Nährwerten kennst:
{"found":true,"name":"Name mit Menge","calories":123,"protein":10,"carbs":20,"fat":5,"portion":"Portionsangabe"}

Wenn unbekannt, erfunden, keine Speise, nur Zutaten ohne Gericht, oder unsicher:
{"found":false}

REGELN:
- Schätze nur die SICHTBARE einzelne Portion auf dem Bild, nicht eine ganze Packung oder mehrere Portionen
- Sei konservativ; wenn Portion oder Gericht unsicher ist, antworte mit {"found":false}
- Keine Fantasiewerte
- Kalorien müssen exakt zu den Makros passen: kcal = 4*protein + 4*carbs + 9*fat
- Kalorien und Makros als ganze Zahlen
- Deutsche Namen.`;

  const messages: { role: string; content: unknown }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: food?.trim() ? `Analysiere: ${food.trim()}` : "Analysiere:" },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `Analysiere: ${food?.trim()}`,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 180,
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANALYZE-FOOD] AI error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("[ANALYZE-FOOD] AI response:", content);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const trimmed = content.trim();
      const startIdx = trimmed.indexOf("{");
      const endIdx = trimmed.lastIndexOf("}");
      if (startIdx === -1 || endIdx === -1) return null;
      parsed = JSON.parse(trimmed.substring(startIdx, endIdx + 1));
    }

    if (parsed.found === false) return null;

    return normalizeAiFoodEstimate(parsed);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new Error("Analyse zu langsam. Bitte erneut versuchen.");
    }
    throw fetchError;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server-Konfiguration fehlt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "AI-Service nicht konfiguriert. Bitte kontaktiere den Admin.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      token,
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { food, imageBase64 } = parseResult.data;
    const uploadPromise = imageBase64
      ? uploadFoodPhoto(supabaseAdmin, user.id, imageBase64)
      : Promise.resolve(null);

    // 1) Text search: Open Food Facts first (verified database)
    if (food?.trim() && !imageBase64) {
      console.log("[ANALYZE-FOOD] OFF search:", food.trim());
      const offMatch = await searchOpenFoodFacts(food.trim());
      if (offMatch) {
        console.log("[ANALYZE-FOOD] OFF hit:", offMatch.name);
        return successResponse(offMatch);
      }
      console.log("[ANALYZE-FOOD] OFF miss, trying OpenAI");
    }

    // 2) OpenAI fallback (text not in OFF, or photo analysis)
    const aiResult = await analyzeWithOpenAI(OPENAI_API_KEY, food, imageBase64);
    const imageUrl = await uploadPromise;

    if (!aiResult) {
      return notFoundResponse();
    }

    return successResponse({
      name: aiResult.name,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      portion: aiResult.portion,
      source: "ai",
      image_url: imageUrl || undefined,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ANALYZE-FOOD] Error:", errorMessage, error);

    if (errorMessage.includes("zu langsam")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 408,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Analyse fehlgeschlagen. Bitte erneut versuchen.",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
