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

const ZERO_CALORIE_NAME_RX =
  /\b(wasserflasche|trinkwasser|mineralwasser|stilles\s*wasser|wasser|water|sprudel|sodawasser|tee\b|kräutertee|grüner\s*tee|schwarzer\s*tee|kaffee\s*schwarz|espresso\s*pur|diet\s*cola|zero\s*cola|light\s*cola|cola\s*zero)\b/i;

function isZeroCalorieFoodName(name: string): boolean {
  return ZERO_CALORIE_NAME_RX.test(name.trim());
}

function zeroCalorieFoodResult(name: string): Record<string, unknown> {
  const label = name.trim() || "Wasser";
  const displayName =
    /\b(wasser|water|mineralwasser|trinkwasser|sprudel)\b/i.test(label) ? "Wasser" : label;
  return {
    found: true,
    name: displayName,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: "1 Glas",
    source: "ai",
  };
}

/** Typical tracker portions for pantry items — before noisy Open Food Facts matches. */
function lookupReferenceFoodByText(query: string): OffFoodResult | null {
  const q = offNormalizeQuery(query);
  if (!q) return null;

  if (q === "kakao" || q === "kakaopulver" || q === "cocoa" || q === "cocoa powder") {
    return {
      name: "Kakaopulver (1 EL)",
      calories: 18,
      protein: 1,
      carbs: 3,
      fat: 1,
      portion: "1 EL (~8 g)",
      source: "open_food_facts",
    };
  }

  return null;
}

function lookupZeroCalorieByText(query: string): OffFoodResult | null {
  const q = offNormalizeQuery(query);
  if (!q) return null;
  if (
    q === "wasser" ||
    q === "water" ||
    q.includes("mineralwasser") ||
    q.includes("stilles wasser") ||
    q === "sprudel" ||
    q === "sodawasser"
  ) {
    return {
      name: "Wasser",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      portion: "1 Glas",
      source: "open_food_facts",
    };
  }
  if (isZeroCalorieFoodName(q)) {
    return {
      name: q.charAt(0).toUpperCase() + q.slice(1),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      portion: "1 Portion",
      source: "open_food_facts",
    };
  }
  return null;
}
const AI_MACRO_KCAL_TOLERANCE = 50;
/** Single visible plate/bowl — clamp instead of rejecting large meals */
const MAX_AI_CALORIES = 2800;
const MAX_AI_PROTEIN = 180;
const MAX_AI_CARBS = 350;
const MAX_AI_FAT = 180;

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
  let score = 0;
  if (name === q) score = 100;
  else if (name.startsWith(q) || name.includes(` ${q}`)) score = 80;
  else if (name.includes(q)) score = 60;
  else {
    const qTokens = q.split(" ").filter(Boolean);
    const matched = qTokens.filter((t) => name.includes(t)).length;
    score = (matched / qTokens.length) * 50;
  }

  // "Kakao" in tracker = cocoa powder, not chocolate drinks / candy bars.
  if (q === "kakao" || q === "kakaopulver" || q.includes("kakaopulver")) {
    if (/\bpulver\b|\bpowder\b/.test(name)) score += 28;
    if (/\bkakao\b/.test(name) && !/\b(getränk|drink|milch|milk|riegel|bar|tafel)\b/.test(name)) {
      score += 12;
    }
    if (/\b(getränk|drink|trinkschokolade|schokoladenmilch|milch|milk|riegel|tafel|nutella|schokoriegel)\b/.test(name)) {
      score -= 45;
    }
    if (/\bschokolade\b/.test(name) && !/\bpulver\b/.test(name)) score -= 25;
  }

  return score;
}

const OFF_POWDER_RX =
  /\b(kakaopulver|cocoa powder|backpulver|matcha|vanillepulver|zucker|sugar|mehl|flour|salz|salt)\b/i;
const OFF_DRINK_RX = /\b(getränk|drink|saft|juice|limonade|cola|milch|milk)\b/i;

function offResolveServingGrams(
  product: Record<string, unknown>,
  productName: string,
  query: string,
): { grams: number; portionLabel: string } {
  const servingSizeRaw = String(product.serving_size || "").trim();
  const sq = offParseNumber(product.serving_quantity);
  const gFromLabel = servingSizeRaw.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  const parsedLabelG = gFromLabel ? offParseNumber(gFromLabel[1]) : 0;

  if (sq > 0 && sq <= 250) {
    const grams = parsedLabelG > 0 ? Math.min(sq, parsedLabelG) : sq;
    return { grams, portionLabel: servingSizeRaw || `${grams}g` };
  }
  if (parsedLabelG > 0 && parsedLabelG <= 250) {
    return { grams: parsedLabelG, portionLabel: servingSizeRaw };
  }

  const name = productName.toLowerCase();
  const q = offNormalizeQuery(query);
  const powderIntent = q === "kakao" || q === "kakaopulver" || OFF_POWDER_RX.test(name);

  if (powderIntent && !OFF_DRINK_RX.test(name)) {
    return { grams: 8, portionLabel: "1 EL (~8 g)" };
  }

  return { grams: 100, portionLabel: servingSizeRaw || "100g" };
}

function offDisplayName(productName: string, query: string, portionLabel: string): string {
  const q = offNormalizeQuery(query);
  const name = productName.trim();
  if (!name) return query.trim();

  if ((q === "kakao" || q === "kakaopulver") && /\bkakao\b/i.test(name) && !OFF_DRINK_RX.test(name)) {
    return portionLabel.startsWith("1 EL") ? "Kakaopulver (1 EL)" : "Kakaopulver";
  }

  if (portionLabel && portionLabel !== "100g" && !name.toLowerCase().includes(portionLabel.toLowerCase())) {
    return `${name} (${portionLabel})`;
  }
  return name;
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

  const { grams: servingQty, portionLabel: portion } = offResolveServingGrams(
    product,
    name,
    query,
  );

  const multiplier = servingQty / 100;
  const displayName = offDisplayName(name, query, portion);

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

    if (best && best.score < 35) return null;
    return best?.food ?? null;
  } catch (err) {
    console.warn("[OFF] Search failed:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// --- end Open Food Facts ---

// MARK: - Barcode-specific lookup

function isBarcode(query: string): boolean {
  // EAN-8, EAN-13, UPC-A (12), UPC-E (6), GTIN-14
  return /^\d{6,14}$/.test(query.trim());
}

/** Direct OFF product barcode API — much faster and more accurate than search. */
async function lookupOffProductByBarcode(barcode: string): Promise<OffFoodResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}` +
      `?fields=code,product_name,product_name_de,nutriments,serving_size,serving_quantity,brands`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const mapped = mapOffProductToFood(data.product as Record<string, unknown>, barcode);
    if (mapped) console.log("[ANALYZE-FOOD] OFF barcode hit:", mapped.name);
    return mapped;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Ask GPT-4o to identify a product by its EAN/UPC barcode number. */
async function analyzeBarcodeWithOpenAI(
  apiKey: string,
  barcode: string,
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              `Du bist eine Lebensmittel-Datenbank. Identifiziere Produkte anhand ihrer EAN/UPC-Barcode-Nummer und nenne realistische Nährwerte.\n` +
              `Antworte NUR mit JSON, kein anderer Text.\n\n` +
              `Wenn du das Produkt kennst:\n` +
              `{"found":true,"name":"Produktname","calories":N,"protein":N,"carbs":N,"fat":N,"portion":"typische Portion oder 100g"}\n\n` +
              `Kalorien und Makros für eine typische Portion (z.B. 30g Müsli, 1 Riegel, 100ml). Makros müssen stimmen: kcal ≈ 4×Protein + 4×Carbs + 9×Fett.\n\n` +
              `Nur wenn der Barcode dir völlig unbekannt ist:\n{"found":false}`,
          },
          { role: "user", content: `Barcode: ${barcode}` },
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    console.log("[ANALYZE-FOOD] AI barcode response:", content);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      return null;
    }
    if (parsed.found === false || !parsed.name) return null;
    return normalizeAiFoodEstimate(parsed);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

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

function clampMacroGrams(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function normalizeAiFoodEstimate(parsed: Record<string, unknown>) {
  const name = String(parsed.name || "").trim();
  if (!name) return null;

  const statedCalories = Math.max(0, Math.round(Number(parsed.calories) || 0));
  if (statedCalories === 0 && isZeroCalorieFoodName(name)) {
    return zeroCalorieFoodResult(name);
  }

  let protein = clampMacroGrams(Number(parsed.protein) || 0, MAX_AI_PROTEIN);
  let carbs = clampMacroGrams(Number(parsed.carbs) || 0, MAX_AI_CARBS);
  let fat = clampMacroGrams(Number(parsed.fat) || 0, MAX_AI_FAT);
  let derivedCalories = Math.max(0, Math.round(macroCalories(protein, carbs, fat)));

  if (protein + carbs + fat <= 0) {
    if (statedCalories > 0) {
      protein = Math.round(statedCalories * 0.25 / 4);
      carbs = Math.round(statedCalories * 0.45 / 4);
      fat = Math.round(statedCalories * 0.30 / 9);
      derivedCalories = Math.round(macroCalories(protein, carbs, fat));
    } else if (isZeroCalorieFoodName(name)) {
      return zeroCalorieFoodResult(name);
    } else {
      return null;
    }
  }

  if (derivedCalories > MAX_AI_CALORIES) {
    const scale = MAX_AI_CALORIES / derivedCalories;
    protein = clampMacroGrams(protein * scale, MAX_AI_PROTEIN);
    carbs = clampMacroGrams(carbs * scale, MAX_AI_CARBS);
    fat = clampMacroGrams(fat * scale, MAX_AI_FAT);
    derivedCalories = Math.round(macroCalories(protein, carbs, fat));
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
  const systemPrompt = `Du bist Ernährungs-Assistent für ein Foto-Tagebuch. Antworte NUR mit JSON, kein anderer Text.

Wenn auf dem Bild erkennbar ESSEN, ein GETRÄNK oder ein LEBENSMITTEL-PRODUKT ist:
{"found":true,"name":"Deutscher Name mit Menge","calories":123,"protein":10,"carbs":20,"fat":5,"portion":"z.B. 1 Teller"}

Erkenne auch:
- Fertige Gerichte (Brot, Obst, Joghurt, Pizza, Nudeln, Reis, Salat, Suppe, Sandwich, Smoothie, Snacks)
- Verpackte Lebensmittel anhand sichtbarer Produktbezeichnung (Cornflakes, Müsli, Kakaopulver, Nudeln, Reis, Mehl, Käse, Wurst, Milch, Joghurt, Marmelade, Kaffee, Tee)
- Getränke (Wasserflasche, Mineralwasser, Sprudel, Saft, Kaffee mit Milch, Smoothie)

Nur für reines Wasser / Mineralwasser / ungesüßten Tee / schwarzen Kaffee (ohne Zucker/Milch) — calories und alle Makros = 0.
Für normales Essen und verpackte Produkte IMMER realistische calories > 0 und passende Makros — nie alles 0.
Bei nur sichtbarer Verpackung: schätze eine typische Portion (z.B. "1 Schüssel Cornflakes mit Milch", "1 EL Kakaopulver").
Kakaopulver/Kakao-Pulver: IMMER nur 1 EL (~8 g) schätzen — ca. 18 kcal, nicht die ganze Packung (100 g wären ~380 kcal).

NUR wenn das Bild wirklich KEIN Essen/Produkt zeigt (leerer Teller, nur Besteck, Person, Landschaft, leere Verpackung ohne lesbares Produkt):
{"found":false}

REGELN:
- Schätze die SICHTBARE oder typische Portion — lieber eine grobe Schätzung als ablehnen
- Lies Produktnamen auf Kartons, Dosen und Packungen
- Keine Fantasie-Produkte erfinden
- Kalorien müssen zu den Makros passen: kcal = 4*protein + 4*carbs + 9*fat
- Ganze Zahlen für Kalorien und Makros
- Deutsche Namen`;

  const messages: { role: string; content: unknown }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: food?.trim() ? `Was ist auf diesem Foto? Kontext: ${food.trim()}` : "Was ist das Essen auf diesem Foto? Schätze Nährwerte für die sichtbare Portion." },
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
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 280,
        temperature: 0.25,
        response_format: { type: "json_object" },
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

    // Accept legacy responses without explicit "found" when macros are present
    if (parsed.found !== true && !parsed.name) return null;

    return normalizeAiFoodEstimate(parsed);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new Error("Analyse zu langsam. Bitte erneut versuchen.");
    }
    throw fetchError;
  }
}

function authFailureMessage(err: { message?: string } | null): string {
  const msg = (err?.message ?? "").toLowerCase();
  if (msg.includes("expired") || msg.includes("jwt expired")) {
    return "Session abgelaufen. Bitte erneut anmelden.";
  }
  if (msg.includes("invalid") || msg.includes("malformed")) {
    return "Ungültige Anmeldung. Bitte erneut anmelden.";
  }
  return "Anmeldung erforderlich. Bitte einloggen.";
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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Anmeldung erforderlich. Bitte einloggen." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError) {
      console.warn("[ANALYZE-FOOD] auth failed:", authError.message);
      return new Response(
        JSON.stringify({ error: "unauthorized", message: authFailureMessage(authError) }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Ungültige Session. Bitte erneut anmelden." }),
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

    // 0) Barcode path — OFF direct product API + OpenAI barcode recognition run in parallel.
    //    OFF wins when it has a complete result (precise database); OpenAI fills the gap
    //    for products not yet in OFF.
    if (food?.trim() && !imageBase64 && isBarcode(food.trim())) {
      const barcode = food.trim();
      console.log("[ANALYZE-FOOD] Barcode lookup:", barcode);
      const [offRes, aiRes] = await Promise.allSettled([
        lookupOffProductByBarcode(barcode),
        analyzeBarcodeWithOpenAI(OPENAI_API_KEY, barcode),
      ]);
      const off = offRes.status === "fulfilled" ? offRes.value : null;
      const ai = aiRes.status === "fulfilled" ? aiRes.value : null;
      // Prefer OFF (authoritative database) when it has calorie data; fall back to AI
      const result = (off && off.calories > 0) ? off : ai;
      if (result) {
        console.log("[ANALYZE-FOOD] Barcode result:", (result as { name?: string }).name, off ? "(OFF)" : "(AI)");
        return successResponse(result as Record<string, unknown>);
      }
      console.log("[ANALYZE-FOOD] Barcode not found:", barcode);
      return notFoundResponse();
    }

    // 1) Text search: zero-cal drinks, then Open Food Facts
    if (food?.trim() && !imageBase64) {
      const zeroCal = lookupZeroCalorieByText(food.trim());
      if (zeroCal) {
        console.log("[ANALYZE-FOOD] zero-cal hit:", zeroCal.name);
        return successResponse(zeroCal);
      }
      const refFood = lookupReferenceFoodByText(food.trim());
      if (refFood) {
        console.log("[ANALYZE-FOOD] reference pantry hit:", refFood.name);
        return successResponse(refFood);
      }
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
