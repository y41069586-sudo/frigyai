/** Open Food Facts search + product mapping (bundled with analyze-food). */

export type OffFoodResult = {
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

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function kcalPer100g(nutriments: Record<string, unknown>): number {
  const kcal = parseNumber(nutriments["energy-kcal_100g"]) ||
    parseNumber(nutriments["energy-kcal"]) ||
    parseNumber(nutriments["energy-kcal_serving"]);
  if (kcal > 0) return kcal;
  const kj = parseNumber(nutriments["energy_100g"]) || parseNumber(nutriments["energy"]);
  if (kj > 0) return kj / 4.184;
  return 0;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function nameScore(productName: string, query: string): number {
  const name = productName.toLowerCase();
  const q = normalizeQuery(query);
  if (!q) return 0;
  if (name === q) return 100;
  if (name.startsWith(q) || name.includes(` ${q}`)) return 80;
  if (name.includes(q)) return 60;
  const qTokens = q.split(" ").filter(Boolean);
  const matched = qTokens.filter((t) => name.includes(t)).length;
  return (matched / qTokens.length) * 50;
}

export function mapOffProductToFood(
  product: Record<string, unknown>,
  query: string,
): OffFoodResult | null {
  const nutriments = (product.nutriments as Record<string, unknown>) || {};
  const kcal100 = kcalPer100g(nutriments);
  if (kcal100 <= 0 || kcal100 > 900) return null;

  const proteins100 = parseNumber(nutriments.proteins_100g);
  const carbs100 = parseNumber(nutriments.carbohydrates_100g);
  const fat100 = parseNumber(nutriments.fat_100g);

  const rawName =
    (product.product_name_de as string) ||
    (product.product_name as string) ||
    query.trim();
  const name = rawName.trim();
  if (name.length < 2) return null;

  let servingQty = parseNumber(product.serving_quantity);
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

export async function searchOpenFoodFacts(
  query: string,
): Promise<OffFoodResult | null> {
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
      const score = nameScore(productName, trimmed) + (mapped.calories > 0 ? 10 : 0);

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
