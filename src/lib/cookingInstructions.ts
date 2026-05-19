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
  if (lower.includes("garen") || lower.includes("back") || lower.includes("köchel"))
    return "Garen";
  if (lower.includes("pause") || lower.includes("ruhen") || lower.includes("ziehen"))
    return "Pause";
  if (lower.includes("anricht") || lower.includes("servier")) return "Anrichten";
  if (lower.includes("koch") || lower.includes("brat") || lower.includes("erhitz"))
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
        /^(Vorbereitung|Kochen|Garen|Pause|Anrichten)/i,
      );
      if (phaseOnly) phase = normalizePhase(phaseOnly[1]);
    }
  }

  const tipMatch = text.match(/\s*(?:Tipp|Hinweis):\s*(.+)$/i);
  if (tipMatch) {
    tip = tipMatch[1].trim();
    text = text.replace(/\s*(?:Tipp|Hinweis):\s*.+$/i, "").trim();
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

function formatStep(minutes: number, phase: CookingPhase, text: string, tip?: string): string {
  const base = `[${minutes} Min | ${phase}] ${text}`;
  return tip ? `${base} Tipp: ${tip}` : base;
}

function prepHintForIngredient(name: string, amount: string): string {
  const n = name.toLowerCase();
  const qty = amount ? `${amount} ` : "";
  if (/ei/.test(n))
    return `${qty}${name} aus dem Kühlschrank holen, auf Zimmertemperatur kommen lassen (ca. 10 Min vorher).`;
  if (/hähnchen|pute|fleisch|hack|steak|schnitzel|wurst/.test(n))
    return `${qty}${name}: trocken tupfen, große Sehnen entfernen, in mundgerechte Stücke schneiden.`;
  if (/kartoffel|möhre|zwiebel|knoblauch|paprika|gurke|salat|tomate/.test(n))
    return `${qty}${name}: gründlich waschen, schälen falls nötig, in gleichmäßige Stücke schneiden.`;
  if (/reis|nudel|pasta|spaghetti|hafer|müsli/.test(n))
    return `${qty}${name} abmessen und bereitstellen.`;
  if (/milch|sahne|joghurt|quark|käse|butter/.test(n))
    return `${qty}${name} bereitstellen und bei Bedarf in Stückchen/Würfeln portionieren.`;
  return `${qty}${name}: abmessen, ggf. waschen oder in passende Stücke schneiden.`;
}

function cookingHintsForMeal(name: string): string[] {
  const n = name.toLowerCase();
  if (/nudel|pasta|spaghetti|penne/.test(n))
    return [
      formatStep(
        2,
        "Kochen",
        "Großen Topf mit reichlich Salzwasser zum kräftigen Kochen bringen (ca. 1 Liter Wasser pro 100 g Nudeln).",
      ),
      formatStep(
        8,
        "Garen",
        "Nudeln einlegen, nach Packungsangabe al dente kochen (meist 8–11 Min). Gelegentlich umrühren, damit nichts anklebt.",
        "Eine Minute vor Ende eine Schöpfkelle Kochwasser aufheben – hilft beim Binden der Soße.",
      ),
    ];
  if (/reis/.test(n))
    return [
      formatStep(
        1,
        "Kochen",
        "Reis in einem Sieb kalt abspülen, bis das Wasser klarer wird.",
      ),
      formatStep(
        15,
        "Garen",
        "Reis mit der doppelten Menge Wasser und einer Prise Salz aufkochen, Hitze reduzieren, zugedeckt 12–15 Min köcheln lassen, bis das Wasser aufgesogen ist.",
        "Topf nicht öffnen – Dampf entweicht und der Reis wird gummig.",
      ),
    ];
  if (/schnitzel|steak|hähnchen|lachs|fisch|brat|pfanne/.test(n))
    return [
      formatStep(
        2,
        "Kochen",
        "Pfanne auf mittlere bis hohe Stufe vorheizen, 1–2 EL Öl oder Butter erhitzen, bis es leicht schäumt.",
      ),
      formatStep(
        6,
        "Kochen",
        "Protein von allen Seiten anbraten, nur einmal wenden wenn die Unterseite goldbraun ist. Kerntemperatur/Farbe prüfen (Fisch: matt und flockig; Hähnchen: innen nicht rosa).",
        "Zu viel in der Pfanne = es dämpft statt zu braten. Lieber in zwei Durchgängen.",
      ),
    ];
  if (/suppe|eintopf|curry|soße|sauce/.test(n))
    return [
      formatStep(
        3,
        "Kochen",
        "Topf oder große Pfanne auf mittlere Stufe stellen, aromatische Zutaten (Zwiebel, Knoblauch) in etwas Öl glasig dünsten.",
      ),
      formatStep(
        12,
        "Garen",
        "Flüssigkeit und restliche Zutaten zugeben, aufkochen, dann 10–15 Min köcheln lassen, bis alles gar und die Soße leicht eingedickt ist. Regelmäßig umrühren.",
      ),
    ];
  if (/ofen|auflauf|überback|pizza/.test(n))
    return [
      formatStep(
        3,
        "Garen",
        "Backofen auf 180–200 °C Ober-/Unterhitze vorheizen.",
      ),
      formatStep(
        20,
        "Garen",
        "Form oder Blech in die Mitte des Ofens schieben, bis Oberfläche goldbraun und die Füllung durchgegart ist.",
        "Ofentür möglichst geschlossen halten – Temperatur fällt sonst stark ab.",
      ),
    ];
  return [
    formatStep(
      5,
      "Kochen",
      "Alle vorbereiteten Zutaten in passendem Topf oder Pfanne auf mittlerer Stufe unter Rühren garen, bis alles durchgegart und heiß ist.",
    ),
  ];
}

export function buildExpandedInstructions(meal: MealForInstructions): string[] {
  const existing = (meal.instructions || []).filter((s) => s.trim().length > 0);
  if (isInstructionsDetailed(existing)) return existing;

  const prepTime = Math.max(5, meal.prepTime || 20);
  const ingredients = meal.ingredients || [];
  const steps: string[] = [];

  const setupMin = Math.min(3, Math.max(2, Math.round(prepTime * 0.1)));
  steps.push(
    formatStep(
      setupMin,
      "Vorbereitung",
      `Arbeitsfläche säubern, Schneidebrett, scharfes Messer, Schüsseln und Küchenwaage bereitlegen. Rezept „${meal.name}“ durchlesen, damit du den Ablauf kennst.`,
    ),
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
        prepHintForIngredient(ing.name, ing.amount),
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
      steps.push(formatStep(cookBudget, "Kochen", clean));
    }
  } else {
    steps.push(...cookingHintsForMeal(meal.name));
  }

  const serveMin = Math.max(2, Math.round(prepTime * 0.1));
  steps.push(
    formatStep(
      serveMin,
      "Anrichten",
      `„${meal.name}“ auf vorgewärmten Tellern anrichten, mit Salz und Pfeffer abschmecken, sofort servieren – am besten noch heiß genießen.`,
    ),
  );

  return steps;
}

export function getDetailedInstructions(meal: MealForInstructions): string[] {
  const existing = (meal.instructions || []).filter((s) => s.trim().length > 0);
  if (existing.length > 0 && isInstructionsDetailed(existing)) return existing;
  if (existing.length > 0 && !isInstructionsDetailed(existing)) {
    return buildExpandedInstructions(meal);
  }
  return buildExpandedInstructions(meal);
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
