import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { readUserMealPlanProfile } from "@/lib/mealAllergySafety";
import { toast } from "@/hooks/use-toast";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";

type DietId = "balanced" | "vegan" | "vegetarian" | "keto" | "low-carb" | "paleo";

const DIET_OPTIONS: { id: DietId; emoji: string }[] = [
  { id: "balanced", emoji: "🥗" },
  { id: "vegan", emoji: "🌱" },
  { id: "vegetarian", emoji: "🧀" },
  { id: "keto", emoji: "🥩" },
  { id: "low-carb", emoji: "🥑" },
  { id: "paleo", emoji: "🍖" },
];

const DIET_LABELS: Record<"de" | "en" | "fr", Record<DietId, string>> = {
  de: {
    balanced: "Ausgewogene Ernährung",
    vegan: "Vegan",
    vegetarian: "Vegetarisch",
    keto: "Keto",
    "low-carb": "Kohlenhydratarm",
    paleo: "Paleo",
  },
  en: {
    balanced: "Balanced nutrition",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    keto: "Keto",
    "low-carb": "Low-carb",
    paleo: "Paleo",
  },
  fr: {
    balanced: "Alimentation équilibrée",
    vegan: "Végan",
    vegetarian: "Végétarien",
    keto: "Cétogène",
    "low-carb": "Faible en glucides",
    paleo: "Paléo",
  },
};

export function DietPreferencesSettings() {
  const { language } = useLanguage();
  const { settings, saveSettings, loading } = useTrackerSettings();
  const lang = (language === "en" || language === "fr" ? language : "de") as "de" | "en" | "fr";
  const labels = DIET_LABELS[lang];

  const [selectedDiet, setSelectedDiet] = useState<DietId | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const profile = readUserMealPlanProfile();
    const id = (profile.dietaryPreferences?.[0] ?? settings?.dietaryPreferences?.[0] ?? null) as DietId | null;
    setSelectedDiet(id);
  }, [settings?.dietaryPreferences, loading]);

  const persist = async (dietId: DietId) => {
    setSaving(true);
    try {
      const profile = readUserMealPlanProfile();
      const storedRaw = localStorage.getItem("userProfile");
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      const next = {
        ...stored,
        ...settings,
        dietaryPreferences: [dietId],
        healthGoals: profile.healthGoals,
        allergies: profile.allergies,
        allergiesOther: profile.allergiesOther,
      };
      localStorage.setItem("userProfile", JSON.stringify(next));
      notifyFrigyStorageUpdated();

      if (settings) {
        await saveSettings({
          ...settings,
          dietaryPreferences: [dietId],
          healthGoals: profile.healthGoals,
          allergies: profile.allergies,
          allergiesOther: profile.allergiesOther,
        });
      }

      toast({
        title: lang === "de" ? "Gespeichert" : lang === "fr" ? "Enregistré" : "Saved",
        description:
          lang === "de"
            ? "Dein Ernährungsziel wird beim nächsten Wochenplan berücksichtigt."
            : lang === "fr"
              ? "Ton objectif alimentaire sera pris en compte au prochain plan."
              : "Your dietary goal will apply to the next weekly plan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const select = (id: DietId) => {
    setSelectedDiet(id);
    void persist(id);
  };

  const sectionTitle =
    lang === "de"
      ? "Ernährungsziel"
      : lang === "fr"
        ? "Objectif alimentaire"
        : "Dietary goal";

  return (
    <div className="px-4 py-3 space-y-3">
      <p className="text-[15px] font-medium text-foreground">{sectionTitle}</p>
      <p className="text-xs text-muted-foreground">
        {lang === "de"
          ? "Wirkt auf KI-Wochenplan und Rezeptvorschläge."
          : lang === "fr"
            ? "S'applique au plan hebdomadaire IA et aux recettes."
            : "Applies to AI weekly plan and recipe suggestions."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {DIET_OPTIONS.map((opt) => {
          const active = selectedDiet === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={saving}
              onClick={() => select(opt.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="min-w-0 flex-1 leading-tight">{labels[opt.id]}</span>
              {active && <Check className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
