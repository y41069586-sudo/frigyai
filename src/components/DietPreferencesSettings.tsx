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

export function DietPreferencesSettings() {
  const { t } = useLanguage();
  const { settings, saveSettings, loading } = useTrackerSettings();

  const dietLabels: Record<DietId, string> = {
    balanced: t.dietBalanced,
    vegan: t.dietVegan,
    vegetarian: t.dietVegetarian,
    keto: t.dietKeto,
    "low-carb": t.dietLowCarb,
    paleo: t.dietPaleo,
  };

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
        title: t.dietPreferencesSavedTitle,
        description: t.dietPreferencesSavedDesc,
      });
    } finally {
      setSaving(false);
    }
  };

  const select = (id: DietId) => {
    setSelectedDiet(id);
    void persist(id);
  };

  return (
    <div className="px-4 py-3 space-y-3">
      <p className="text-[15px] font-medium text-foreground">{t.dietPreferencesTitle}</p>
      <p className="text-xs text-muted-foreground">{t.dietPreferencesSubtitle}</p>
      <div className="grid grid-cols-2 gap-2">
        {DIET_OPTIONS.map((opt) => {
          const active = selectedDiet === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={saving}
              onClick={() => select(opt.id)}
              className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/10 font-semibold text-foreground"
                  : "border-border/60 bg-background hover:border-primary/30"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="flex-1 leading-tight">{dietLabels[opt.id]}</span>
              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
