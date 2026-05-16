import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Barcode, Camera, ChevronLeft, Crown, Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brandColors";
import {
  MEAL_FOCUS_SEARCH_PLACEHOLDER_DE,
  MEAL_FOCUS_TITLES_DE,
  MEAL_LOG_GENERIC_PLACEHOLDER_DE,
  type MealFocusKey,
} from "@/lib/mealFocus";
import { cn } from "@/lib/utils";

export type TrackerRecipeExample = {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type TrackerLoggedMeal = {
  id: string;
  name: string;
  calories: number;
  time?: string;
};

type InputMode = "search" | "camera" | "barcode";

type Props = {
  /** Nur gesetzt, wenn Nutzer über Mahlzeiten-Slot (+) kommt — dann Titel oben anzeigen */
  mealFocus: MealFocusKey | null;
  onClose: () => void;
  onSearchSubmit: (text: string) => void;
  onCamera: () => void;
  onBarcode: () => void;
  onAddRecipe: (recipe: TrackerRecipeExample) => void;
  loggedMeals?: TrackerLoggedMeal[];
  isAnalyzing?: boolean;
  isPremium?: boolean;
  onPremiumRequired?: () => void;
};

const PALETTE = {
  bg: BRAND.mintBg,
  primary: BRAND.primary,
  primaryDark: BRAND.primaryDark,
  chip: BRAND.chipBg,
  text: BRAND.text,
  textMuted: BRAND.textMuted,
  border: "#D1E8DD",
};

const GREEN_SHADOW = "0 4px 18px -4px rgba(30, 215, 138, 0.32)";
const GREEN_SHADOW_TOP = "0 -10px 24px -8px rgba(30, 215, 138, 0.2)";

function RoundPlusButton({
  onClick,
  disabled,
  label,
  size = "md",
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "size-3.5" : "size-4";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-50",
        dim,
      )}
      style={{ backgroundColor: PALETTE.chip }}
    >
      <Plus className={icon} strokeWidth={2.5} style={{ color: PALETTE.primary }} />
    </button>
  );
}

const INPUT_MODES: {
  id: InputMode;
  label: string;
  icon: typeof Search;
  tint: string;
  premium?: boolean;
}[] = [
  { id: "search", label: "Suche", icon: Search, tint: PALETTE.primary },
  { id: "camera", label: "Kamera", icon: Camera, tint: "#EC4899", premium: true },
  { id: "barcode", label: "Barcode", icon: Barcode, tint: "#EF4444", premium: true },
];

let cachedExampleRecipes: TrackerRecipeExample[] | null = null;

function mealPlanFallbackRecipes(): TrackerRecipeExample[] {
  try {
    const raw = localStorage.getItem("weeklyMealPlan");
    if (!raw) return [];
    const plan = JSON.parse(raw) as {
      meals: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }[];
    }[];
    const seen = new Set<string>();
    const out: TrackerRecipeExample[] = [];
    for (const day of plan) {
      for (const meal of day.meals ?? []) {
        if (!meal.name || seen.has(meal.name)) continue;
        seen.add(meal.name);
        out.push({
          id: `plan-${meal.name}`,
          title: meal.name,
          calories: meal.calories ?? 0,
          protein: meal.protein ?? 0,
          carbs: meal.carbs ?? 0,
          fat: meal.fat ?? 0,
        });
        if (out.length >= 8) return out;
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function TrackerAddMealPanel({
  mealFocus,
  onClose,
  onSearchSubmit,
  onCamera,
  onBarcode,
  onAddRecipe,
  loggedMeals = [],
  isAnalyzing = false,
  isPremium = true,
  onPremiumRequired,
}: Props) {
  const [mode, setMode] = useState<InputMode>("search");
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<TrackerRecipeExample[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(() => cachedExampleRecipes === null);
  const [loggedListOpen, setLoggedListOpen] = useState(false);
  const mealCount = loggedMeals.length;
  const inputRef = useRef<HTMLInputElement>(null);
  const recipesFetchStarted = useRef(false);

  const showMealTitle = mealFocus != null;
  const title = mealFocus ? MEAL_FOCUS_TITLES_DE[mealFocus] : "";
  const placeholder = mealFocus
    ? MEAL_FOCUS_SEARCH_PLACEHOLDER_DE[mealFocus]
    : MEAL_LOG_GENERIC_PLACEHOLDER_DE;

  useEffect(() => {
    if (cachedExampleRecipes) {
      setRecipes(cachedExampleRecipes);
      setLoadingRecipes(false);
      return;
    }
    if (recipesFetchStarted.current) return;
    recipesFetchStarted.current = true;

    let cancelled = false;
    (async () => {
      setLoadingRecipes(true);
      try {
        const { data, error } = await supabase
          .from("community_recipes")
          .select("id, title, calories, protein, carbs, fat")
          .order("likes_count", { ascending: false })
          .limit(12);

        if (error) throw error;

        const mapped: TrackerRecipeExample[] = (data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          calories: Math.round(r.calories ?? 0),
          protein: Math.round(r.protein ?? 0),
          carbs: Math.round(r.carbs ?? 0),
          fat: Math.round(r.fat ?? 0),
        }));

        const list = mapped.length > 0 ? mapped : mealPlanFallbackRecipes();
        if (!cancelled) {
          cachedExampleRecipes = list;
          setRecipes(list);
        }
      } catch {
        const list = mealPlanFallbackRecipes();
        if (!cancelled) {
          cachedExampleRecipes = list;
          setRecipes(list);
        }
      } finally {
        if (!cancelled) setLoadingRecipes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode === "search") {
      const t = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

  const runPremiumAction = (action: () => void) => {
    if (!isPremium) {
      onPremiumRequired?.();
      return;
    }
    action();
  };

  const handleModeSelect = (next: InputMode) => {
    setMode(next);
    if (next === "camera") {
      runPremiumAction(onCamera);
      return;
    }
    if (next === "barcode") {
      runPremiumAction(onBarcode);
    }
  };

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || isAnalyzing) return;
    onSearchSubmit(trimmed);
    setQuery("");
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      <div
        className="flex shrink-0 items-center px-3 pb-2"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          minHeight: showMealTitle ? undefined : "3.25rem",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Zurück"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors"
          style={{
            backgroundColor: PALETTE.chip,
            borderColor: PALETTE.border,
            color: PALETTE.primaryDark,
          }}
        >
          <ChevronLeft className="size-5" />
        </button>
        {showMealTitle ? (
          <h1 className="flex-1 text-center text-[17px] font-semibold tracking-tight">{title}</h1>
        ) : (
          <div className="flex-1" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => setLoggedListOpen(true)}
          className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border px-2 text-[15px] font-bold tabular-nums transition-transform active:scale-95"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: PALETTE.border,
            color: PALETTE.primaryDark,
            boxShadow: GREEN_SHADOW,
          }}
          aria-label={`${mealCount} Mahlzeiten heute. Liste anzeigen.`}
        >
          {mealCount}
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3">
          <div className="grid grid-cols-3 gap-2">
            {INPUT_MODES.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleModeSelect(item.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-2.5 transition-all",
                    active ? "bg-white shadow-sm" : "border-transparent bg-white/70",
                  )}
                  style={{
                    borderColor: active ? PALETTE.primary : "transparent",
                  }}
                >
                  {item.premium && !isPremium && (
                    <Crown
                      className="absolute right-1.5 top-1.5 size-2.5 rotate-12"
                      style={{ color: PALETTE.primary }}
                      fill={PALETTE.primary}
                    />
                  )}
                  <Icon
                    className="size-5"
                    style={{ color: active ? item.tint : PALETTE.textMuted }}
                  />
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: active ? PALETTE.text : PALETTE.textMuted }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <div
              className="flex items-center gap-2 rounded-2xl border-2 bg-white px-3 py-0.5 shadow-sm"
              style={{ borderColor: PALETTE.primary }}
            >
              <Search className="size-4 shrink-0" style={{ color: PALETTE.primary }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder={placeholder}
                disabled={isAnalyzing}
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none placeholder:text-[#9CA3AF]"
                style={{ color: PALETTE.text }}
              />
              {query.trim() ? (
                <RoundPlusButton
                  onClick={submitSearch}
                  disabled={isAnalyzing}
                  label="Suche absenden"
                  size="sm"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1"
          style={{
            backgroundColor: PALETTE.bg,
            boxShadow: GREEN_SHADOW_TOP,
          }}
        >
          {loadingRecipes ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3 rounded-2xl bg-white px-4 py-3.5"
                  style={{ boxShadow: GREEN_SHADOW }}
                >
                  <div className="h-5 flex-1 rounded-lg bg-[#EDFAF4]" />
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[#DCF5EA]" />
                </div>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm" style={{ color: PALETTE.textMuted }}>
              Noch keine Rezepte in der Datenbank. Beschreibe dein Essen oben oder scanne es.
            </p>
          ) : (
            <ul className="space-y-2">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <div
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3"
                    style={{ boxShadow: GREEN_SHADOW }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold leading-tight">{recipe.title}</p>
                    </div>
                    <span
                      className="shrink-0 text-[14px] font-semibold tabular-nums"
                      style={{ color: PALETTE.text }}
                    >
                      {recipe.calories} kcal
                    </span>
                    <RoundPlusButton
                      onClick={() => onAddRecipe(recipe)}
                      disabled={isAnalyzing}
                      label={`${recipe.title} hinzufügen`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AnimatePresence>
          {loggedListOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/25"
                aria-label="Liste schließen"
                onClick={() => setLoggedListOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="absolute inset-x-0 bottom-0 z-30 flex max-h-[72vh] flex-col rounded-t-[1.75rem] bg-white"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                  boxShadow: "0 -16px 40px -12px rgba(30, 215, 138, 0.35)",
                }}
              >
                <motion.div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{ borderColor: PALETTE.border }}
                >
                  <h2 className="text-[17px] font-semibold">Heutige Mahlzeiten</h2>
                  <button
                    type="button"
                    onClick={() => setLoggedListOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: PALETTE.chip, color: PALETTE.primaryDark }}
                    aria-label="Schließen"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
                <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                  {mealCount === 0 ? (
                    <li className="py-10 text-center text-sm" style={{ color: PALETTE.textMuted }}>
                      Noch keine Mahlzeiten geloggt
                    </li>
                  ) : (
                    loggedMeals.map((meal) => (
                      <li
                        key={meal.id}
                        className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 last:mb-0"
                        style={{ boxShadow: GREEN_SHADOW }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold">{meal.name}</p>
                          {meal.time ? (
                            <p className="text-xs" style={{ color: PALETTE.textMuted }}>
                              {meal.time}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className="shrink-0 text-sm font-semibold tabular-nums"
                          style={{ color: PALETTE.primaryDark }}
                        >
                          {meal.calories} kcal
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
