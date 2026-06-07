type ParsedAmount =
  | { kind: "mass"; grams: number }
  | { kind: "volume"; ml: number }
  | { kind: "count"; count: number; unit: string }
  | { kind: "unknown"; raw: string };

function parseNum(raw: string): number {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function normalizeCountUnit(raw: string): string {
  const u = raw.toLowerCase().replace(/\./g, "");
  if (u === "st" || u === "stück" || u === "stk") return "stück";
  if (u === "port" || u === "portion") return "portion";
  if (u === "el") return "el";
  if (u === "tl") return "tl";
  if (u === "x") return "stück";
  if (u === "scheibe" || u === "scheiben") return "scheibe";
  return u;
}

export function parseIngredientAmount(raw: string): ParsedAmount | null {
  const t = String(raw ?? "").trim();
  if (!t || t === "—" || t === "-") return null;

  let m = t.match(/^([\d.,]+)\s*(kg|g|mg)$/i);
  if (m) {
    const val = parseNum(m[1]);
    const unit = m[2].toLowerCase();
    const grams = unit === "kg" ? val * 1000 : unit === "mg" ? val / 1000 : val;
    return { kind: "mass", grams };
  }

  m = t.match(/^([\d.,]+)\s*(l|ml|cl|dl)$/i);
  if (m) {
    const val = parseNum(m[1]);
    const unit = m[2].toLowerCase();
    const ml = unit === "l" ? val * 1000 : unit === "cl" ? val * 10 : unit === "dl" ? val * 100 : val;
    return { kind: "volume", ml };
  }

  m = t.match(/^([\d.,]+)\s*(stück|st\.?|portion|port\.?|el|tl|x|scheiben?|dosen?|packung|bund)$/i);
  if (m) {
    return { kind: "count", count: parseNum(m[1]), unit: normalizeCountUnit(m[2]) };
  }

  if (/^[\d.,]+$/.test(t)) {
    return { kind: "count", count: parseNum(t), unit: "portion" };
  }

  return { kind: "unknown", raw: t };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatCount(count: number, unit: string): string {
  const c = round1(count);
  if (unit === "stück") return `${c} Stück`;
  if (unit === "portion") return `${c} ${c === 1 ? "Portion" : "Portionen"}`;
  if (unit === "el") return `${c} EL`;
  if (unit === "tl") return `${c} TL`;
  if (unit === "scheibe") return `${c} ${c === 1 ? "Scheibe" : "Scheiben"}`;
  return `${c} ${unit}`;
}

export function aggregateAmountStrings(amounts: string[]): string {
  let grams = 0;
  let ml = 0;
  const counts = new Map<string, number>();
  const unknown: string[] = [];

  for (const raw of amounts) {
    const p = parseIngredientAmount(raw);
    if (!p) continue;
    if (p.kind === "mass") grams += p.grams;
    else if (p.kind === "volume") ml += p.ml;
    else if (p.kind === "count") counts.set(p.unit, (counts.get(p.unit) ?? 0) + p.count);
    else if (p.kind === "unknown") unknown.push(p.raw);
  }

  const parts: string[] = [];
  if (grams > 0) parts.push(grams >= 1000 ? `${round1(grams / 1000)} kg` : `${Math.round(grams)} g`);
  if (ml > 0) parts.push(ml >= 1000 ? `${round1(ml / 1000)} l` : `${Math.round(ml)} ml`);
  for (const [unit, count] of counts) {
    if (count > 0) parts.push(formatCount(count, unit));
  }
  for (const u of unknown) {
    if (!parts.includes(u)) parts.push(u);
  }

  if (parts.length) return parts.join(" · ");

  const fallback = amounts.map((a) => String(a ?? "").trim()).filter(Boolean);
  return fallback.length ? [...new Set(fallback)].join(" · ") : "—";
}

export function isGenericPortionAmount(amount: string): boolean {
  const t = amount.trim().toLowerCase();
  return t === "1 portion" || t === "1 port." || t === "portion" || t === "—" || t === "-";
}
