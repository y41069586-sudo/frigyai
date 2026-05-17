import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Barcode, Camera, ChevronLeft, Crown, Plus, Search, Trash2, X } from "lucide-react";
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
  ingredients?: string[];
  instructions?: string[];
  prepTime?: number;
};

export type TrackerLoggedMeal = {
  id: string;
  name: string;
  calories: number;
  time?: string;
  mealType?: MealFocusKey;
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
  onDeleteMeal?: (id: string) => void;
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

function DetailMacro({
  label,
  value,
  unit = "",
  tint,
}: {
  label: string;
  value: number;
  unit?: string;
  tint: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-1.5 py-2 text-center">
      <p className="text-[15px] font-black leading-none tabular-nums" style={{ color: tint }}>
        {Math.round(value)}
        {unit}
      </p>
      <p className="mt-1 text-[9px] font-semibold text-zinc-500">{label}</p>
    </div>
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

const BUILTIN_EXAMPLE_RECIPES: TrackerRecipeExample[] = [
  {
    id: "example-chicken-rice",
    title: "Hähnchen-Reis-Bowl",
    calories: 620,
    protein: 48,
    carbs: 72,
    fat: 14,
    prepTime: 25,
    ingredients: ["150g Hähnchenbrust", "90g Reis", "150g Brokkoli", "1 TL Olivenöl", "Gewürze"],
    instructions: ["Reis nach Packungsangabe kochen.", "Hähnchen würzen und in wenig Öl braten.", "Brokkoli dünsten.", "Alles in einer Bowl anrichten."],
  },
  {
    id: "example-protein-oats",
    title: "Protein-Haferbrei",
    calories: 510,
    protein: 36,
    carbs: 62,
    fat: 12,
    prepTime: 10,
    ingredients: ["70g Haferflocken", "250ml Milch oder Pflanzendrink", "30g Proteinpulver", "1 Banane", "Zimt"],
    instructions: ["Haferflocken mit Milch aufkochen.", "Kurz abkühlen lassen und Proteinpulver einrühren.", "Banane schneiden und mit Zimt servieren."],
  },
  {
    id: "example-salmon-potatoes",
    title: "Lachs mit Kartoffeln",
    calories: 680,
    protein: 42,
    carbs: 55,
    fat: 30,
    prepTime: 30,
    ingredients: ["160g Lachsfilet", "250g Kartoffeln", "150g Gemüse", "1 TL Öl", "Zitrone"],
    instructions: ["Kartoffeln kochen.", "Lachs würzen und in der Pfanne braten.", "Gemüse dünsten und alles mit Zitrone servieren."],
  },
  {
    id: "example-quark-bowl",
    title: "Quark-Beeren-Bowl",
    calories: 390,
    protein: 38,
    carbs: 42,
    fat: 6,
    prepTime: 5,
    ingredients: ["250g Magerquark", "150g Beeren", "30g Haferflocken", "1 TL Honig"],
    instructions: ["Quark cremig rühren.", "Beeren und Haferflocken darübergeben.", "Mit Honig abrunden."],
  },
  {
    id: "example-turkey-wrap",
    title: "Puten-Wrap",
    calories: 560,
    protein: 44,
    carbs: 58,
    fat: 16,
    prepTime: 15,
    ingredients: ["1 großer Wrap", "140g Putenbrust", "Salat", "Tomate", "40g Joghurt-Dip"],
    instructions: ["Putenbrust anbraten.", "Wrap kurz erwärmen.", "Mit Gemüse und Dip füllen und einrollen."],
  },
  {
    id: "example-lentil-curry",
    title: "Linsen-Curry",
    calories: 590,
    protein: 28,
    carbs: 78,
    fat: 18,
    prepTime: 25,
    ingredients: ["100g rote Linsen", "200ml Kokosmilch light", "Tomaten", "Spinat", "Currypulver"],
    instructions: ["Linsen mit Tomaten und Gewürzen köcheln.", "Kokosmilch zugeben.", "Spinat unterheben und abschmecken."],
  },
  {
    id: "example-egg-bread",
    title: "Vollkornbrot mit Ei",
    calories: 450,
    protein: 24,
    carbs: 42,
    fat: 20,
    prepTime: 10,
    ingredients: ["2 Scheiben Vollkornbrot", "2 Eier", "Tomaten", "Schnittlauch"],
    instructions: ["Eier kochen oder braten.", "Brot belegen.", "Mit Tomaten und Schnittlauch servieren."],
  },
  {
    id: "example-pasta-tuna",
    title: "Thunfisch-Pasta",
    calories: 650,
    protein: 45,
    carbs: 82,
    fat: 14,
    prepTime: 20,
    ingredients: ["100g Pasta", "1 Dose Thunfisch", "Tomatensauce", "Mais", "Kräuter"],
    instructions: ["Pasta kochen.", "Sauce mit Thunfisch und Mais erwärmen.", "Pasta unterheben und würzen."],
  },
  {
    id: "example-tofu-rice",
    title: "Tofu-Gemüse-Reis",
    calories: 610,
    protein: 32,
    carbs: 76,
    fat: 20,
    prepTime: 25,
    ingredients: ["180g Tofu", "90g Reis", "Gemüsemix", "Sojasauce", "1 TL Öl"],
    instructions: ["Reis kochen.", "Tofu würfeln und knusprig braten.", "Gemüse zugeben und mit Sojasauce abschmecken."],
  },
  {
    id: "example-greek-salad",
    title: "Griechischer Salat mit Brot",
    calories: 520,
    protein: 22,
    carbs: 48,
    fat: 26,
    prepTime: 12,
    ingredients: ["Feta", "Gurke", "Tomaten", "Oliven", "2 Scheiben Brot"],
    instructions: ["Gemüse schneiden.", "Feta und Oliven zugeben.", "Mit Brot servieren."],
  },
  {
    id: "example-beef-potato",
    title: "Rinderhack-Kartoffel-Pfanne",
    calories: 720,
    protein: 46,
    carbs: 60,
    fat: 32,
    prepTime: 30,
    ingredients: ["160g Rinderhack", "300g Kartoffeln", "Paprika", "Zwiebel", "Gewürze"],
    instructions: ["Kartoffeln würfeln und vorgaren.", "Hackfleisch anbraten.", "Gemüse und Kartoffeln zugeben und fertig braten."],
  },
  {
    id: "example-smoothie",
    title: "Protein-Smoothie",
    calories: 360,
    protein: 32,
    carbs: 45,
    fat: 6,
    prepTime: 5,
    ingredients: ["250ml Milch", "30g Proteinpulver", "1 Banane", "100g Beeren"],
    instructions: ["Alle Zutaten in den Mixer geben.", "Cremig mixen.", "Direkt trinken."],
  },
];

function mergeUniqueRecipes(...lists: TrackerRecipeExample[][]): TrackerRecipeExample[] {
  const seen = new Set<string>();
  const out: TrackerRecipeExample[] = [];
  for (const list of lists) {
    for (const recipe of list) {
      const key = recipe.title.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(recipe);
    }
  }
  return out;
}

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
          ingredients: (meal as any).ingredients?.map((i: any) => `${i.amount ?? ""} ${i.name ?? ""}`.trim()).filter(Boolean),
          instructions: (meal as any).instructions,
          prepTime: (meal as any).prepTime,
        });
        if (out.length >= 12) return out;
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
  onDeleteMeal,
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
  const [selectedRecipe, setSelectedRecipe] = useState<TrackerRecipeExample | null>(null);
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
          .select("id, title, calories, protein, carbs, fat, ingredients, instructions, prep_time")
          .order("likes_count", { ascending: false })
          .limit(24);

        if (error) throw error;

        const mapped: TrackerRecipeExample[] = (data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          calories: Math.round(r.calories ?? 0),
          protein: Math.round(r.protein ?? 0),
          carbs: Math.round(r.carbs ?? 0),
          fat: Math.round(r.fat ?? 0),
          ingredients: Array.isArray((r as any).ingredients) ? (r as any).ingredients : undefined,
          instructions: Array.isArray((r as any).instructions) ? (r as any).instructions : undefined,
          prepTime: Math.round((r as any).prep_time ?? 0) || undefined,
        }));

        const list = mergeUniqueRecipes(mapped, mealPlanFallbackRecipes(), BUILTIN_EXAMPLE_RECIPES);
        if (!cancelled) {
          cachedExampleRecipes = list;
          setRecipes(list);
        }
      } catch {
        const list = mergeUniqueRecipes(mealPlanFallbackRecipes(), BUILTIN_EXAMPLE_RECIPES);
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
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 1.05 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      <div
        className="flex shrink-0 items-center px-3 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
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
        <div className="shrink-0 px-3 pt-1">
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
                  <button
                    type="button"
                    onClick={() => setSelectedRecipe(recipe)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition-transform active:scale-[0.99]"
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
                      onClick={() => setSelectedRecipe(recipe)}
                      disabled={isAnalyzing}
                      label={`${recipe.title} Details anzeigen`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AnimatePresence>
          {selectedRecipe && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/25"
                aria-label="Details schließen"
                onClick={() => setSelectedRecipe(null)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
                className="absolute inset-x-0 bottom-0 z-30 flex max-h-[82vh] flex-col rounded-t-[1.9rem] bg-white"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                  boxShadow: "0 -18px 48px -18px rgba(15,40,30,0.28)",
                }}
              >
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-zinc-300" />
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: PALETTE.textMuted }}>
                    Mahlzeit
                  </p>
                  <h2 className="mt-1 text-[24px] font-black leading-tight tracking-[-0.04em]">
                    {selectedRecipe.title}
                  </h2>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <DetailMacro label="kcal" value={selectedRecipe.calories} tint="#F97316" />
                    <DetailMacro label="Protein" value={selectedRecipe.protein} unit="g" tint="#E11D48" />
                    <DetailMacro label="Carbs" value={selectedRecipe.carbs} unit="g" tint="#D97706" />
                    <DetailMacro label="Fett" value={selectedRecipe.fat} unit="g" tint="#0284C7" />
                  </div>

                  {selectedRecipe.ingredients?.length ? (
                    <section className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
                      <h3 className="mb-2 text-[16px] font-bold">Zutaten</h3>
                      <ul className="space-y-1.5">
                        {selectedRecipe.ingredients.map((ingredient, idx) => (
                          <li key={`${ingredient}-${idx}`} className="rounded-xl bg-white px-3 py-2 text-sm font-medium">
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
                    <h3 className="mb-2 text-[16px] font-bold">Zubereitung</h3>
                    <ol className="space-y-2">
                      {(selectedRecipe.instructions?.length
                        ? selectedRecipe.instructions
                        : [
                            "Zutaten vorbereiten und passend portionieren.",
                            "Alles frisch zubereiten und nach Geschmack würzen.",
                            "Direkt servieren und bei Bedarf im Tracker anpassen.",
                          ]
                      ).map((step, idx) => (
                        <li key={`${step}-${idx}`} className="flex gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DCF5EA] text-xs font-bold" style={{ color: PALETTE.primaryDark }}>
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-zinc-200 px-4 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRecipe(null)}
                    className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 text-sm font-bold"
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => {
                      onAddRecipe(selectedRecipe);
                      setSelectedRecipe(null);
                    }}
                    className="flex h-12 items-center justify-center rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: PALETTE.primary }}
                  >
                    Hinzufügen
                  </button>
                </div>
              </motion.div>
            </>
          )}
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
                          {meal.time || meal.mealType ? (
                            <p className="text-xs" style={{ color: PALETTE.textMuted }}>
                              {meal.mealType ? `${MEAL_FOCUS_TITLES_DE[meal.mealType]} · ` : ""}
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
                        {onDeleteMeal ? (
                          <button
                            type="button"
                            onClick={() => onDeleteMeal(meal.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                            style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                            aria-label={`${meal.name} löschen`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
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
