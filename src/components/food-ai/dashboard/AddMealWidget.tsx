import { motion } from "framer-motion";
import { Camera, PenLine, Sparkles, UtensilsCrossed } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type AddMealWidgetProps = {
  delay?: number;
  onScan: () => void;
  onManual: () => void;
  onGenerateRecipe: () => void;
};

export function AddMealWidget({ delay = 0, onScan, onManual, onGenerateRecipe }: AddMealWidgetProps) {
  const { language } = useLanguage();
  const copy = language === "fr"
    ? {
        label: "Repas",
        title: "Que manges-tu ?",
        scanTitle: "Scanner un repas",
        scanSubtitle: "Camera · saisie rapide",
        manualTitle: "Ajouter manuellement",
        manualSubtitle: "Suivi",
        recipeTitle: "Generer une recette",
        recipeSubtitle: "IA · depuis ton frigo",
      }
    : language === "en"
      ? {
          label: "Meals",
          title: "What are you eating?",
          scanTitle: "Scan meal",
          scanSubtitle: "Camera · quick capture",
          manualTitle: "Add manually",
          manualSubtitle: "Tracker",
          recipeTitle: "Generate recipe",
          recipeSubtitle: "AI · from your fridge",
        }
      : {
          label: "Essen",
          title: "Was isst du?",
          scanTitle: "Meal scannen",
          scanSubtitle: "Kamera · schnell erfassen",
          manualTitle: "Manuell hinzufügen",
          manualSubtitle: "Tracker",
          recipeTitle: "Rezept generieren",
          recipeSubtitle: "KI · aus Vorrat",
        };
  return (
    <WidgetCard delay={delay} variant="gradient" interactive={false} className="rounded-[2.25rem] rounded-tl-md">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl rounded-br-lg bg-primary/15">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.label}</p>
          <h3 className="text-xl font-bold tracking-tight">{copy.title}</h3>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay * 0.1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScan}
          className={cn(
            "flex w-full min-h-[100px] flex-row items-center justify-between gap-4 rounded-[1.35rem] rounded-br-[2rem] p-5 text-left",
            "bg-gradient-to-br from-primary/90 to-emerald-600 text-primary-foreground shadow-lg shadow-primary/25",
          )}
        >
          <div className="flex items-center gap-4">
            <Camera className="h-8 w-8 shrink-0 text-primary-foreground" />
            <div>
              <p className="text-base font-bold">{copy.scanTitle}</p>
              <p className="text-sm font-medium text-primary-foreground/85">{copy.scanSubtitle}</p>
            </div>
          </div>
        </motion.button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + delay * 0.1 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onManual}
            className={cn(
              "flex min-h-[88px] flex-1 flex-col items-start justify-between rounded-2xl rounded-bl-xl rounded-tr-2xl border border-border/50 bg-background/70 p-4 text-left backdrop-blur-md",
              "hover:border-primary/30",
            )}
          >
            <PenLine className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{copy.manualTitle}</p>
              <p className="text-[11px] font-medium text-muted-foreground">{copy.manualSubtitle}</p>
            </div>
          </motion.button>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + delay * 0.1 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerateRecipe}
            className={cn(
              "flex min-h-[88px] flex-1 flex-col items-start justify-between rounded-2xl rounded-br-xl rounded-tl-2xl border border-border/50 bg-background/70 p-4 text-left backdrop-blur-md",
              "hover:border-primary/30",
            )}
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{copy.recipeTitle}</p>
              <p className="text-[11px] font-medium text-muted-foreground">{copy.recipeSubtitle}</p>
            </div>
          </motion.button>
        </div>
      </div>
    </WidgetCard>
  );
}
