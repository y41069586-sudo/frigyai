import {
  resolveInstructionLang,
  formatStepTipPrefix,
  setupStepText,
  serveStepText,
  prepHintForIngredient as localizedPrepHint,
  cookingHintsForMeal as localizedCookingHints,
  type InstructionLang,
} from "@/lib/cookingInstructionsI18n";

export type CookingPhase =
  | "Vorbereitung"
  | "Kochen"
  | "Garen"
  | "Pause"
  | "Anrichten"
  | "Sonstiges";

export interface ParsedCookingStep {
  index: number;
  minutes: number | null;
  phase: CookingPhase;
  text: string;
  tip?: string;
}

export interface MealForInstructions {
  name: string;
  prepTime: number;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
}

const PHASES: CookingPhase[] = [
  "Vorbereitung",
  "Kochen",
  "Garen",
  "Pause",
  "Anrichten",
];

function normalizePhase(raw: string): CookingPhase {
  const lower = raw.toLowerCase();
  if (lower.includes("vorbereit") || lower.includes("prep")) return "Vorbereitung";
  if (
    lower.includes("garen") ||
    lower.includes("back") ||
    lower.includes("köchel") ||
    lower.includes("simmer") ||
    lower.includes("bake")
  )
    return "Garen";
  if (
    lower.includes("pause") ||
    lower.includes("ruhen") ||
    lower.includes("ziehen") ||
    lower.includes("rest") ||
    lower.includes("repos")
  )
    return "Pause";
  if (
    lower.includes("anricht") ||
    lower.includes("servier") ||
    lower.includes("serve") ||
    lower.includes("plat") ||
    lower.includes("dresser")
  )
    return "Anrichten";
  if (
    lower.includes("koch") ||
    lower.includes("brat") ||
    lower.includes("erhitz") ||
    lower.includes("cook") ||
    lower.includes("sear") ||
    lower.includes("saut") ||
    lower.includes("cuire") ||
    lower.includes("dorer")
  )
    return "Kochen";
  return "Sonstiges";
}

function inferPhase(text: string, index: number, total: number): CookingPhase {
  const lower = text.toLowerCase();
  if (/anricht|servier|teller|portion|garnier|abschmeck/.test(lower)) return "Anrichten";
  if (/ruhen|ziehen lassen|abkühlen|bedeckt stehen/.test(lower)) return "Pause";
  if (/backofen|ofen|köchel|garen|simmer|dämpf|garzeit/.test(lower)) return "Garen";
  if (/schneid|waschen|schälen|würfel|hacken|messen|vorbereit|mise/.test(lower))
    return "Vorbereitung";
  if (/brat|pfanne|koch|erhitze|anbraten|rühren|umrühren|wenden/.test(lower)) return "Kochen";
  if (index === 0) return "Vorbereitung";
  if (index >= total - 1) return "Anrichten";
  return index < total * 0.35 ? "Vorbereitung" : "Kochen";
}

export function parseCookingStep(raw: string, index: number, total: number): ParsedCookingStep {
  let text = raw.trim();
  let minutes: number | null = null;
  let phase: CookingPhase | null = null;
  let tip: string | undefined;

  const bracket = text.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (bracket) {
    const inside = bracket[1];
    text = bracket[2].trim();
    const minMatch = inside.match(/(\d+)\s*(?:min(?:uten)?)?/i);
    if (minMatch) minutes = Number.parseInt(minMatch[1], 10);
    const pipe = inside.match(/\|\s*(.+)/);
    if (pipe) phase = normalizePhase(pipe[1].trim());
    else {
      const phaseOnly = inside.match(
        /^(Vorbereitung|Kochen|Garen|Pause|Anrichten|Prep(?:aration)?|Cook(?:ing)?|Simmer|Bake|Rest|Serve)/i,
      );
      if (phaseOnly) phase = normalizePhase(phaseOnly[1]);
    }
  }

  const tipMatch = text.match(/\s*(?:Tipp|Hinweis|Tip|Conseil|Note):\s*(.+)$/i);
  if (tipMatch) {
    tip = tipMatch[1].trim();
    text = text.replace(/\s*(?:Tipp|Hinweis|Tip|Conseil|Note):\s*.+$/i, "").trim();
  }

  if (!phase) phase = inferPhase(text, index, total);

  return {
    index,
    minutes: minutes != null && Number.isFinite(minutes) ? minutes : null,
    phase,
    text: text || raw.trim(),
    tip,
  };
}

export function isInstructionsDetailed(instructions: string[]): boolean {
  const steps = instructions.filter((s) => s.trim().length > 0);
  if (steps.length < 8) return false;
  const avgLen = steps.reduce((sum, s) => sum + s.length, 0) / steps.length;
  const hasTimes = steps.filter((s) => /\d+\s*min/i.test(s) || /^\[/.test(s.trim())).length >= 4;
  return avgLen >= 70 && hasTimes;
}

function formatStep(
  minutes: number,
  phase: CookingPhase,
  text: string,
  lang: InstructionLang = "de",
  tip?: string,
): string {
  const base = `[${minutes} Min | ${phase}] ${text}`;
  return tip ? `${base} ${formatStepTipPrefix(lang)} ${tip}` : base;
}

export function buildExpandedInstructions(
  meal: MealForInstructions,
  language?: string | null,
): string[] {
  const lang = resolveInstructionLang(language);
  const existing = (meal.instructions || []).filter((s) => s.trim().length > 0);
  if (isInstructionsDetailed(existing)) return existing;

  const prepTime = Math.max(5, meal.prepTime || 20);
  const ingredients = meal.ingredients || [];
  const steps: string[] = [];

  const setupMin = Math.min(3, Math.max(2, Math.round(prepTime * 0.1)));
  steps.push(
    formatStep(setupMin, "Vorbereitung", setupStepText(lang, meal.name), lang),
  );

  const prepPerIng = Math.min(
    4,
    Math.max(2, Math.round((prepTime * 0.35) / Math.max(1, ingredients.length))),
  );
  for (const ing of ingredients) {
    steps.push(
      formatStep(
        prepPerIng,
        "Vorbereitung",
        localizedPrepHint(lang, ing.name, ing.amount),
        lang,
      ),
    );
  }

  if (existing.length > 0) {
    const cookBudget = Math.max(
      4,
      Math.round((prepTime * 0.45) / existing.length),
    );
    for (const line of existing) {
      const clean = line.replace(/^\d+\.\s*/, "").trim();
      steps.push(formatStep(cookBudget, "Kochen", clean, lang));
    }
  } else {
    for (const hint of localizedCookingHints(lang, meal.name)) {
      steps.push(formatStep(hint.minutes, hint.phase, hint.text, lang, hint.tip));
    }
  }

  const serveMin = Math.max(2, Math.round(prepTime * 0.1));
  steps.push(
    formatStep(serveMin, "Anrichten", serveStepText(lang, meal.name), lang),
  );

  return steps;
}

export function getDetailedInstructions(
  meal: MealForInstructions,
  language?: string | null,
): string[] {
  const lang = resolveInstructionLang(language);
  const existing = (meal.instructions || []).filter((s) => s.trim().length > 0);
  if (existing.length > 0 && isInstructionsDetailed(existing)) return existing;
  if (existing.length > 0 && !isInstructionsDetailed(existing)) {
    return buildExpandedInstructions(meal, lang);
  }
  return buildExpandedInstructions(meal, lang);
}

export function parseAllCookingSteps(instructions: string[]): ParsedCookingStep[] {
  const total = instructions.length;
  return instructions.map((step, index) => parseCookingStep(step, index, total));
}

export function sumStepMinutes(steps: ParsedCookingStep[]): number {
  return steps.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
}

export const phaseLabel: Record<CookingPhase, string> = {
  Vorbereitung: "Vorbereitung",
  Kochen: "Kochen",
  Garen: "Garen",
  Pause: "Pause",
  Anrichten: "Anrichten",
  Sonstiges: "Schritt",
};

export const phaseBadgeClass: Record<CookingPhase, string> = {
  Vorbereitung: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  Kochen: "bg-orange-50 text-orange-700 border-orange-200/80",
  Garen: "bg-amber-50 text-amber-800 border-amber-200/80",
  Pause: "bg-slate-100 text-slate-600 border-slate-200/80",
  Anrichten: "bg-primary/10 text-primary border-primary/20",
  Sonstiges: "bg-muted text-muted-foreground border-slate-200/80",
};

export function groupStepsByPhase(
  steps: ParsedCookingStep[],
): { phase: CookingPhase; steps: ParsedCookingStep[] }[] {
  const order = [...PHASES, "Sonstiges" as CookingPhase];
  const groups = new Map<CookingPhase, ParsedCookingStep[]>();
  for (const step of steps) {
    const list = groups.get(step.phase) ?? [];
    list.push(step);
    groups.set(step.phase, list);
  }
  return order
    .filter((p) => groups.has(p))
    .map((phase) => ({ phase, steps: groups.get(phase)! }));
}
