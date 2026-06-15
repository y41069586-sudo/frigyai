import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Barcode, Camera, ChefHat, Clock, Lightbulb, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brandColors";
import {
  MEAL_LOG_GENERIC_PLACEHOLDER_DE,
  type MealFocusKey,
} from "@/lib/mealFocus";
import { cn } from "@/lib/utils";
import { BlurOverlay, BlurView } from "@/components/ui/BlurView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getLocalizedGenericMealPrompt,
  getLocalizedMealFocusPrompt,
  getLocalizedMealFocusTitle,
  getCookingPhaseLabel,
} from "@/lib/mealI18n";
import {
  bottomSheetExit,
  bottomSheetFrom,
  bottomSheetTo,
  bottomSheetTransition,
  fullScreenExit,
  fullScreenFrom,
  fullScreenTo,
  fullScreenTransition,
} from "@/lib/motionPresets";
import {
  getDetailedInstructions,
  groupStepsByPhase,
  parseAllCookingSteps,
  phaseBadgeClass,
  sumStepMinutes,
  type MealForInstructions,
} from "@/lib/cookingInstructions";

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
  /** Datei direkt aus dem Panel — zuverlässiger Kamera-Trigger auf Mobile */
  /** Live-Kamera statt Datei-Picker (Essen scannen) */
  onOpenLiveCamera?: () => void;
  onCameraFile: (file: File) => void;
  onBarcode: () => void;
  onAddRecipe: (recipe: TrackerRecipeExample) => void;
  onDeleteMeal?: (id: string) => void;
  onEditMeal?: (id: string) => void;
  loggedMeals?: TrackerLoggedMeal[];
  isAnalyzing?: boolean;
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

function parseIngredientString(raw: string): { name: string; amount: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([\d.,]+\s*(?:g|kg|ml|l|EL|TL|Stück|St\.?|Portion|Port\.?)?)\s+(.+)$/i);
  if (match) return { amount: match[1].trim(), name: match[2].trim() };
  return { amount: "—", name: trimmed };
}

function recipeToMealForInstructions(recipe: TrackerRecipeExample): MealForInstructions {
  return {
    name: recipe.title,
    prepTime: recipe.prepTime ?? 20,
    ingredients: (recipe.ingredients ?? []).map(parseIngredientString),
    instructions: recipe.instructions ?? [],
  };
}

function RecipePreparationSection({
  recipe,
  copy,
  language,
  preparationLabel,
}: {
  recipe: TrackerRecipeExample;
  language: "de" | "en" | "fr";
  preparationLabel: string;
  copy: {
    cookingHint: string;
    steps: string;
    totalTime: string;
    totalDuration: string;
    timedSteps: string;
  };
}) {
  const meal = recipeToMealForInstructions(recipe);
  const detailedInstructions = getDetailedInstructions(meal, language);
  const parsedSteps = parseAllCookingSteps(detailedInstructions);
  const phaseGroups = groupStepsByPhase(parsedSteps);
  const timedMinutes = sumStepMinutes(parsedSteps);
  const prepTime = meal.prepTime;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200/85 bg-white/72 p-4">
      {(prepTime > 0 || timedMinutes > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium text-foreground">
            {copy.totalTime} {prepTime} {copy.totalDuration}
          </span>
          {timedMinutes > 0 && (
            <span className="text-xs text-muted-foreground">· {timedMinutes} {copy.timedSteps}</span>
          )}
        </div>
      )}

      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2.5">
        <ChefHat className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.cookingHint}</p>
      </div>

      <h3 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-foreground">
        {preparationLabel} ({parsedSteps.length} {copy.steps})
      </h3>

      <div className="space-y-5">
        {phaseGroups.map(({ phase, steps }) => (
          <div key={phase}>
            <p
              className={`mb-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${phaseBadgeClass[phase]}`}
            >
              {getCookingPhaseLabel(phase, language)}
            </p>
            <ol className="space-y-3">
              {steps.map((step) => (
                <li key={step.index} className="rounded-2xl border border-slate-200/70 bg-muted/25 p-3.5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {step.index + 1}
                    </span>
                    {step.minutes != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-slate-200/80">
                        <Clock className="h-3 w-3 text-primary" />
                        {step.minutes} min
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{step.text}</p>
                  {step.tip && (
                    <p className="mt-2.5 flex gap-2 rounded-xl bg-amber-50/90 px-2.5 py-2 text-xs leading-relaxed text-amber-900">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{step.tip}</span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

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
    title: "Haferbrei mit Banane",
    calories: 510,
    protein: 36,
    carbs: 62,
    fat: 12,
    prepTime: 10,
    ingredients: ["70g Haferflocken", "250ml Milch oder Pflanzendrink", "1 Banane", "1 EL Honig", "Zimt"],
    instructions: ["Haferflocken mit Milch aufkochen.", "Banane schneiden und mit Honig und Zimt servieren."],
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
    title: "Joghurt mit Beeren",
    calories: 360,
    protein: 32,
    carbs: 45,
    fat: 6,
    prepTime: 5,
    ingredients: ["200g Naturjoghurt", "100g Beeren", "1 Banane", "1 EL Honig"],
    instructions: ["Joghurt in eine Schüssel geben.", "Beeren und Banane hinzufügen.", "Mit Honig servieren."],
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
  onOpenLiveCamera,
  onCameraFile,
  onBarcode,
  onAddRecipe,
  onDeleteMeal,
  onEditMeal,
  loggedMeals = [],
  isAnalyzing = false,
}: Props) {
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<InputMode>("search");
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<TrackerRecipeExample[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(() => cachedExampleRecipes === null);
  const [loggedListOpen, setLoggedListOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<TrackerRecipeExample | null>(null);
  const mealCount = loggedMeals.length;
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recipesFetchStarted = useRef(false);

  const copy = language === "fr"
    ? {
        back: "Retour",
        camera: "Camera",
        barcode: "Code-barres",
        ingredientsScan: "Ingredients",
        noRecipes: "Aucune recette en base pour le moment. Decris ton repas ci-dessus ou scanne-le.",
        detailsAria: (title: string) => `Afficher les details de ${title}`,
        detailsClose: "Fermer les details",
        mealLabel: "Repas",
        ingredients: "Ingredients",
        cookingHint: "Cuisine pas a pas — temps, phase et gestes precis dans chaque etape.",
        steps: "etapes",
        totalTime: "env.",
        totalDuration: "min au total",
        timedSteps: "min dans les etapes",
        preparationFallback: [
          "Prepare les ingredients et les portions.",
          "Cuisine le tout frais et assaisonne selon ton gout.",
          "Sers directement et ajuste si besoin dans le tracker.",
        ],
        backButton: "Retour",
        add: "Ajouter",
        todayMeals: "Repas d aujourd hui",
        todayMealsAria: (count: number) => `${count} repas aujourd hui. Afficher la liste.`,
        noLoggedMeals: "Aucun repas enregistre pour aujourd hui",
        close: "Fermer",
        deleteMeal: (name: string) => `Supprimer ${name}`,
        kcal: "kcal",
        protein: "Proteines",
        carbs: "Glucides",
        fat: "Lipides",
        addSearch: "Ajouter le repas",
      }
    : language === "en"
      ? {
          back: "Back",
          camera: "Camera",
          barcode: "Barcode",
          ingredientsScan: "Ingredients",
          noRecipes: "No recipes in the database yet. Describe your meal above or scan it.",
          detailsAria: (title: string) => `Show details for ${title}`,
          detailsClose: "Close details",
          mealLabel: "Meal",
          ingredients: "Ingredients",
          cookingHint: "Cook it step by step — each step includes time, phase, and exact actions.",
          steps: "steps",
          totalTime: "approx.",
          totalDuration: "min total time",
          timedSteps: "min in steps",
          preparationFallback: [
            "Prepare the ingredients and portion sizes.",
            "Cook everything fresh and season to taste.",
            "Serve right away and adjust it in the tracker if needed.",
          ],
          backButton: "Back",
          add: "Add",
          todayMeals: "Today's meals",
          todayMealsAria: (count: number) => `${count} meals today. Show list.`,
          noLoggedMeals: "No meals logged today",
          close: "Close",
          deleteMeal: (name: string) => `Delete ${name}`,
          kcal: "kcal",
          protein: "Protein",
          carbs: "Carbs",
          fat: "Fat",
          addSearch: "Add meal",
        }
      : {
          back: "Zurück",
          camera: "Kamera",
          barcode: "Barcode",
          ingredientsScan: "Zutaten",
          noRecipes: "Noch keine Rezepte in der Datenbank. Beschreibe dein Essen oben oder scanne es.",
          detailsAria: (title: string) => `${title} Details anzeigen`,
          detailsClose: "Details schließen",
          mealLabel: "Mahlzeit",
          ingredients: "Zutaten",
          cookingHint: "Schritt fuer Schritt nachkochen — Zeit, Phase und genaue Handgriffe in jedem Schritt.",
          steps: "Schritte",
          totalTime: "ca.",
          totalDuration: "Min Gesamtzeit",
          timedSteps: "Min in den Schritten",
          preparationFallback: [
            "Zutaten vorbereiten und passend portionieren.",
            "Alles frisch zubereiten und nach Geschmack würzen.",
            "Direkt servieren und bei Bedarf im Tracker anpassen.",
          ],
          backButton: "Zurück",
          add: "Hinzufügen",
          todayMeals: "Heutige Mahlzeiten",
          todayMealsAria: (count: number) => `${count} Mahlzeiten heute. Liste anzeigen.`,
          noLoggedMeals: "Noch keine Mahlzeiten geloggt",
          close: "Schließen",
          deleteMeal: (name: string) => `${name} löschen`,
          kcal: "kcal",
          protein: "Protein",
          carbs: "Carbs",
          fat: "Fett",
          addSearch: "Essen hinzufügen",
        };

  const inputModes: {
    id: Exclude<InputMode, "search">;
    label: string;
    icon: typeof Search;
    tint: string;
  }[] = [
    { id: "camera", label: copy.camera, icon: Camera, tint: "#EC4899" },
    { id: "barcode", label: copy.barcode, icon: Barcode, tint: "#EF4444" },
  ];

  const showMealTitle = mealFocus != null;
  const title = mealFocus ? getLocalizedMealFocusTitle(mealFocus, t) : "";
  const placeholder = mealFocus
    ? getLocalizedMealFocusPrompt(mealFocus, language)
    : getLocalizedGenericMealPrompt(language) || MEAL_LOG_GENERIC_PLACEHOLDER_DE;

  useEffect(() => {
    if (cachedExampleRecipes) {
      setRecipes(cachedExampleRecipes);
      setLoadingRecipes(false);
      return;
    }
    if (recipesFetchStarted.current) return;
    recipesFetchStarted.current = true;

    setLoadingRecipes(true);
    const list = mergeUniqueRecipes(mealPlanFallbackRecipes(), BUILTIN_EXAMPLE_RECIPES);
    cachedExampleRecipes = list;
    setRecipes(list);
    setLoadingRecipes(false);
  }, []);

  useEffect(() => {
    if (mode === "search") {
      const t = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

  const handleModeSelect = (next: InputMode) => {
    setMode(next);
    if (next === "camera") {
      if (onOpenLiveCamera) {
        onOpenLiveCamera();
      } else {
        cameraInputRef.current?.click();
      }
      return;
    }
    if (next === "barcode") {
      onBarcode();
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCameraFile(file);
    e.target.value = "";
  };

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || isAnalyzing) return;
    onSearchSubmit(trimmed);
    setQuery("");
  };

  return (
    <motion.div
      initial={fullScreenFrom(isMobile)}
      animate={fullScreenTo(isMobile)}
      exit={fullScreenExit(isMobile)}
      transition={fullScreenTransition(isMobile)}
      className="fixed inset-0 z-[110] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={handleCameraInputChange}
      />
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
          minHeight: "3.25rem",
        }}
      >
        {showMealTitle ? (
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight">{title}</h1>
        ) : (
          <div className="flex-1" aria-hidden />
        )}
        <div className="flex shrink-0 items-center gap-2">
          {mealCount > 0 && (
            <button
              type="button"
              onClick={() => setLoggedListOpen(true)}
              className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/[0.08] px-2 text-[14px] font-bold tabular-nums text-primary transition-opacity active:opacity-70"
              aria-label={copy.todayMealsAria(mealCount)}
            >
              {mealCount}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors active:bg-black/5"
          >
            <X className="size-5" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3 pt-1">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${inputModes.length}, minmax(0, 1fr))` }}
          >
            {inputModes.map((item) => {
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
              <RoundPlusButton
                onClick={submitSearch}
                disabled={isAnalyzing || !query.trim()}
                label={copy.addSearch}
                size="sm"
              />
            </div>
          </div>
        </div>

        <div
          className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-1 safe-bottom"
          style={{
            backgroundColor: PALETTE.bg,
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
              {copy.noRecipes}
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
                      label={copy.detailsAria(recipe.title)}
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20"
              >
                <BlurOverlay className="h-full w-full" onClick={() => setSelectedRecipe(null)} aria-label={copy.detailsClose} />
              </motion.div>
              <motion.div
                initial={bottomSheetFrom(isMobile)}
                animate={bottomSheetTo(isMobile)}
                exit={bottomSheetExit(isMobile)}
                transition={bottomSheetTransition(isMobile)}
                className="absolute inset-x-0 bottom-0 z-30 max-h-[82vh] rounded-t-[1.9rem]"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                  boxShadow: "0 -18px 48px -18px rgba(15,40,30,0.28)",
                }}
              >
                <BlurView variant="sheet" intensity={64} className="flex max-h-[82vh] flex-col overflow-hidden rounded-t-[1.9rem]">
                <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: PALETTE.textMuted }}>
                      {copy.mealLabel}
                    </p>
                    <h2 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.04em]">
                      {selectedRecipe.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipe(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors active:bg-black/5"
                    aria-label={copy.detailsClose}
                  >
                    <X className="size-5" strokeWidth={2.25} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <DetailMacro label={copy.kcal} value={selectedRecipe.calories} tint="#F97316" />
                    <DetailMacro label={copy.protein} value={selectedRecipe.protein} unit="g" tint="#E11D48" />
                    <DetailMacro label={copy.carbs} value={selectedRecipe.carbs} unit="g" tint="#D97706" />
                    <DetailMacro label={copy.fat} value={selectedRecipe.fat} unit="g" tint="#0284C7" />
                  </div>

                  {selectedRecipe.ingredients?.length ? (
                    <section className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
                      <h3 className="mb-2 text-[16px] font-bold">{copy.ingredients}</h3>
                      <ul className="space-y-1.5">
                        {selectedRecipe.ingredients.map((ingredient, idx) => (
                          <li key={`${ingredient}-${idx}`} className="rounded-xl bg-white px-3 py-2 text-sm font-medium">
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <RecipePreparationSection
                    recipe={selectedRecipe}
                    copy={copy}
                    language={language}
                    preparationLabel={t.preparation}
                  />
                </div>

                <div className="shrink-0 border-t border-zinc-200 px-4 pt-3">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => {
                      onAddRecipe(selectedRecipe);
                      setSelectedRecipe(null);
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: PALETTE.primary }}
                  >
                    {copy.add}
                  </button>
                </div>
                </BlurView>
              </motion.div>
            </>
          )}
          {loggedListOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20"
              >
                <BlurOverlay className="h-full w-full" onClick={() => setLoggedListOpen(false)} aria-label={copy.close} />
              </motion.div>
              <motion.div
                initial={bottomSheetFrom(isMobile)}
                animate={bottomSheetTo(isMobile)}
                exit={bottomSheetExit(isMobile)}
                transition={bottomSheetTransition(isMobile)}
                className="absolute inset-x-0 bottom-0 z-30 max-h-[min(72vh,calc(100%-5rem))] rounded-t-[1.75rem] safe-bottom"
                style={{
                  boxShadow: "0 -16px 40px -12px rgba(30, 215, 138, 0.35)",
                }}
              >
                <BlurView variant="sheet" intensity={64} className="flex max-h-[min(72vh,calc(100%-5rem))] flex-col overflow-hidden rounded-t-[1.75rem] safe-bottom">
                <motion.div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{ borderColor: PALETTE.border }}
                >
                  <h2 className="text-[17px] font-semibold">{copy.todayMeals}</h2>
                  <button
                    type="button"
                    onClick={() => setLoggedListOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors active:bg-black/5"
                    aria-label={copy.close}
                  >
                    <X className="size-5" strokeWidth={2.25} />
                  </button>
                </motion.div>
                <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
                  {mealCount === 0 ? (
                    <li className="py-10 text-center text-sm" style={{ color: PALETTE.textMuted }}>
                      {copy.noLoggedMeals}
                    </li>
                  ) : (
                    loggedMeals.map((meal) => (
                      <li
                        key={meal.id}
                        className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 last:mb-0"
                        style={{ boxShadow: GREEN_SHADOW }}
                      >
                        <button
                          type="button"
                          disabled={!onEditMeal}
                          onClick={() => onEditMeal?.(meal.id)}
                          className={cn(
                            "min-w-0 flex-1 text-left",
                            onEditMeal && "touch-manipulation active:opacity-80",
                          )}
                        >
                          <p className="truncate text-[15px] font-semibold">{meal.name}</p>
                          {meal.time || meal.mealType ? (
                            <p className="text-xs" style={{ color: PALETTE.textMuted }}>
                              {meal.mealType ? `${getLocalizedMealFocusTitle(meal.mealType, t)} · ` : ""}
                              {meal.time}
                            </p>
                          ) : null}
                        </button>
                        <span
                          className="shrink-0 text-sm font-semibold tabular-nums"
                          style={{ color: PALETTE.primaryDark }}
                        >
                          {meal.calories} kcal
                        </span>
                        {onDeleteMeal ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMeal(meal.id);
                            }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                            style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                            aria-label={copy.deleteMeal(meal.name)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
                </BlurView>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
