import type { Lang } from "./types.ts";

export function resolveLang(raw: unknown): Lang {
  return (raw === "en" || raw === "fr" || raw === "es" || raw === "it" || raw === "hi") ? raw : "de";
}

/** Structured constraints — serialized to AI prompt only at the boundary. */
export type ConstraintKind = "allergy" | "allergy_other" | "diet" | "goal" | "freeform";

export type ConstraintItem = {
  kind: ConstraintKind;
  id?: string;
  text: string;
};

export type UserConstraintInput = {
  allergies: string[];
  prefs: string[];
  goals: string[];
  other: string;
  lang: Lang;
};

export function buildConstraintItems(input: UserConstraintInput): ConstraintItem[] {
  const items: ConstraintItem[] = [];
  for (const id of input.allergies.filter((x) => x && x !== "none" && x !== "other")) {
    items.push({ kind: "allergy", id, text: id });
  }
  if (input.other.trim()) {
    items.push({ kind: "allergy_other", text: input.other.trim() });
  }
  for (const id of input.prefs.filter((x) => x && x !== "none")) {
    items.push({ kind: "diet", id, text: id });
  }
  for (const id of input.goals.filter((x) => x && x !== "none")) {
    items.push({ kind: "goal", id, text: id });
  }
  return items;
}

/** Compact AI prompt block from structured constraints. */
export function serializeConstraintsForAi(items: ConstraintItem[], lang: Lang): string {
  if (!items.length) return "";
  const lines: string[] = [];
  const allergies = items.filter((i) => i.kind === "allergy");
  const other = items.filter((i) => i.kind === "allergy_other");
  const diets = items.filter((i) => i.kind === "diet");
  const goals = items.filter((i) => i.kind === "goal");

  if (allergies.length) {
    const header = lang === "de" ? "ALLERGIEN:" : lang === "fr" ? "ALLERGIES:" : "ALLERGIES:";
    lines.push(header, ...allergies.map((a) => `- ${a.text}`));
  }
  for (const o of other) lines.push(`- other: ${o.text}`);
  for (const d of diets) lines.push(`Diet: ${d.text}`);
  for (const g of goals) lines.push(`Goal: ${g.text}`);
  return lines.join("\n");
}

export function buildConstraintPrompt(input: UserConstraintInput): string {
  return serializeConstraintsForAi(buildConstraintItems(input), input.lang);
}

/** @deprecated Use buildConstraintPrompt — kept for direct string callers. */
export function buildConstraints(
  allergies: string[],
  prefs: string[],
  goals: string[],
  other: string,
  lang: Lang,
): string {
  return buildConstraintPrompt({ allergies, prefs, goals, other, lang });
}
