import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

interface DailyCoachCardProps {
  caloriesEaten: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
  carbsEaten: number;
  targetCarbs: number;
  fatEaten: number;
  targetFat: number;
  onOpenChat: (message: string) => void;
  language: "de" | "en" | "fr";
}

type FocusType = "protein" | "over_budget" | "undereating" | "on_track";

function getFocus(
  caloriesEaten: number,
  targetCalories: number,
  proteinEaten: number,
  targetProtein: number
): FocusType {
  const calRatio = caloriesEaten / targetCalories;
  const proteinRatio = proteinEaten / targetProtein;
  const currentHour = new Date().getHours();

  if (proteinRatio < 0.6) return "protein";
  if (calRatio > 1.1) return "over_budget";
  if (calRatio < 0.3 && currentHour >= 12) return "undereating";
  return "on_track";
}

interface CoachContent {
  message: string;
  chatMessage: string;
}

function getContent(
  focus: FocusType,
  language: "de" | "en" | "fr",
  remainingCal: number,
  remainingProtein: number,
  caloriesEaten: number,
  targetCalories: number
): CoachContent {
  const aboveBy = Math.abs(remainingCal);

  switch (language) {
    case "en":
      switch (focus) {
        case "protein":
          return {
            message: `Your protein intake is low today. Try adding a high-protein snack or meal. Aim for ${remainingProtein}g more protein.`,
            chatMessage: `I still have ${remainingCal} kcal and ${remainingProtein}g of protein left today. What should I eat for dinner to hit my protein goal?`,
          };
        case "over_budget":
          return {
            message: `You've exceeded your calorie budget by ${aboveBy} kcal today. Focus on lighter, protein-rich options for your next meal.`,
            chatMessage: `I've gone ${aboveBy} kcal over my budget today. What are some light, filling options to end the day on track?`,
          };
        case "undereating":
          return {
            message: `You haven't eaten much yet today. Make sure to fuel your body — skipping meals can slow your progress.`,
            chatMessage: `I've only eaten ${caloriesEaten} kcal out of my ${targetCalories} kcal goal. What balanced meal should I have now?`,
          };
        case "on_track":
        default:
          return {
            message: `Great job! You're on track today. You have ${remainingCal} kcal and ${remainingProtein}g protein remaining. Keep it up!`,
            chatMessage: `I have ${remainingCal} kcal and ${remainingProtein}g of protein left for today. What should I eat for dinner to finish the day perfectly?`,
          };
      }
    case "fr":
      switch (focus) {
        case "protein":
          return {
            message: `Votre apport en protéines est faible aujourd'hui. Essayez d'ajouter une collation riche en protéines. Visez ${remainingProtein}g de plus.`,
            chatMessage: `Il me reste encore ${remainingCal} kcal et ${remainingProtein}g de protéines aujourd'hui. Que devrais-je manger ce soir pour atteindre mon objectif protéique ?`,
          };
        case "over_budget":
          return {
            message: `Vous avez dépassé votre budget calorique de ${aboveBy} kcal aujourd'hui. Privilégiez des options légères pour votre prochain repas.`,
            chatMessage: `J'ai dépassé mon budget de ${aboveBy} kcal aujourd'hui. Quelles sont les options légères et rassasiantes pour terminer la journée ?`,
          };
        case "undereating":
          return {
            message: `Vous n'avez pas encore beaucoup mangé aujourd'hui. Pensez à nourrir votre corps — sauter des repas peut ralentir vos progrès.`,
            chatMessage: `Je n'ai mangé que ${caloriesEaten} kcal sur mon objectif de ${targetCalories} kcal. Quel repas équilibré devrais-je prendre maintenant ?`,
          };
        case "on_track":
        default:
          return {
            message: `Excellent travail ! Vous êtes sur la bonne voie aujourd'hui. Il vous reste ${remainingCal} kcal et ${remainingProtein}g de protéines. Continuez !`,
            chatMessage: `Il me reste ${remainingCal} kcal et ${remainingProtein}g de protéines pour aujourd'hui. Que devrais-je manger ce soir pour terminer la journée parfaitement ?`,
          };
      }
    case "de":
    default:
      switch (focus) {
        case "protein":
          return {
            message: `Deine Proteinzufuhr ist heute niedrig. Versuche einen proteinreichen Snack einzubauen. Du brauchst noch ${remainingProtein}g Protein.`,
            chatMessage: `Ich habe heute noch ${remainingCal} kcal und ${remainingProtein}g Protein übrig. Was soll ich zum Abendessen essen, um mein Proteinziel zu erreichen?`,
          };
        case "over_budget":
          return {
            message: `Du hast dein Kalorienbudget heute um ${aboveBy} kcal überschritten. Wähle für die nächste Mahlzeit leichtere, proteinreiche Optionen.`,
            chatMessage: `Ich habe heute mein Kalorienbudget um ${aboveBy} kcal überschritten. Welche leichten, sättigenden Optionen gibt es für den Rest des Tages?`,
          };
        case "undereating":
          return {
            message: `Du hast heute noch nicht viel gegessen. Versorge deinen Körper mit Energie — Mahlzeiten auslassen kann deinen Fortschritt bremsen.`,
            chatMessage: `Ich habe heute erst ${caloriesEaten} kcal von meinem ${targetCalories} kcal-Ziel gegessen. Welche ausgewogene Mahlzeit sollte ich jetzt zu mir nehmen?`,
          };
        case "on_track":
        default:
          return {
            message: `Super! Du bist heute auf Kurs. Dir bleiben noch ${remainingCal} kcal und ${remainingProtein}g Protein übrig. Weiter so!`,
            chatMessage: `Ich habe heute noch ${remainingCal} kcal und ${remainingProtein}g Protein übrig. Was soll ich zum Abendessen essen, um den Tag perfekt abzuschließen?`,
          };
      }
  }
}

function getButtonLabel(language: "de" | "en" | "fr"): string {
  switch (language) {
    case "en": return "Ask AI Coach";
    case "fr": return "Demander au coach";
    case "de":
    default: return "KI-Coach fragen";
  }
}

function getRemainingLabel(language: "de" | "en" | "fr"): string {
  switch (language) {
    case "en": return "remaining";
    case "fr": return "restants";
    case "de":
    default: return "übrig";
  }
}

export const DailyCoachCard = ({
  caloriesEaten,
  targetCalories,
  proteinEaten,
  targetProtein,
  carbsEaten,
  targetCarbs,
  fatEaten,
  targetFat,
  onOpenChat,
  language,
}: DailyCoachCardProps) => {
  if (caloriesEaten === 0) return null;

  const remainingCal = Math.round(targetCalories - caloriesEaten);
  const remainingProtein = Math.round(targetProtein - proteinEaten);

  const focus = getFocus(caloriesEaten, targetCalories, proteinEaten, targetProtein);
  const content = getContent(
    focus,
    language,
    remainingCal,
    remainingProtein,
    caloriesEaten,
    targetCalories
  );

  const isOverBudget = focus === "over_budget";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl border p-3.5 ${
        isOverBudget
          ? "bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/30"
          : "bg-[#75FBB2]/10 dark:bg-[#39D47F]/10 border-[#75FBB2]/40 dark:border-[#39D47F]/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isOverBudget
              ? "bg-orange-100 dark:bg-orange-900/40"
              : "bg-[#75FBB2]/30 dark:bg-[#39D47F]/20"
          }`}
        >
          <Sparkles
            className={`w-4 h-4 ${
              isOverBudget ? "text-orange-500" : "text-[#39D47F]"
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground/80 leading-relaxed mb-2">
            {content.message}
          </p>

          {/* Remaining summary */}
          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {isOverBudget ? `+${Math.abs(remainingCal)}` : remainingCal}
              </span>{" "}
              kcal{" "}
              {getRemainingLabel(language)}
            </span>
            <span className="w-px h-3 bg-border" />
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {Math.max(0, remainingProtein)}g
              </span>{" "}
              Protein
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onOpenChat(content.chatMessage)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              isOverBudget
                ? "bg-orange-500/15 text-orange-700 dark:text-orange-400 hover:bg-orange-500/25"
                : "bg-[#39D47F]/20 text-[#1a7a4a] dark:text-[#75FBB2] hover:bg-[#39D47F]/30"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            {getButtonLabel(language)}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
