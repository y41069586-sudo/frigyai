import { motion } from 'framer-motion';
import { MacroRing } from './MacroRing';
import { Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MacroDisplayProps {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
  variant?: 'full' | 'compact' | 'rings-only';
  showCalorieBar?: boolean;
}

export const MacroDisplay = ({
  calories,
  protein,
  carbs,
  fat,
  variant = 'full',
  showCalorieBar = true,
}: MacroDisplayProps) => {
  const { t } = useLanguage();
  const caloriePercentage = Math.min((calories.current / calories.target) * 100, 100);
  const isOverCalories = calories.current > calories.target;

  if (variant === 'rings-only') {
    return (
      <div className="grid grid-cols-3 gap-4">
        <MacroRing
          value={protein.current}
          max={protein.target}
          label={t.protein}
          color="protein"
          size="sm"
        />
        <MacroRing
          value={carbs.current}
          max={carbs.target}
          label={t.carbs}
          color="carbs"
          size="sm"
        />
        <MacroRing
          value={fat.current}
          max={fat.target}
          label={t.fat}
          color="fat"
          size="sm"
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div 
        className="p-4 rounded-2xl bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border border-border/50 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/20">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.today}</p>
              <p className="font-bold">
                <span className={isOverCalories ? 'text-red-400' : 'text-primary'}>
                  {calories.current}
                </span>
                <span className="text-muted-foreground text-sm"> / {calories.target} kcal</span>
              </p>
            </div>
          </div>
        </div>

        {showCalorieBar && (
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full rounded-full ${isOverCalories ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-green-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${caloriePercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <MacroRing
            value={protein.current}
            max={protein.target}
            label={t.protein}
            color="protein"
            size="sm"
          />
          <MacroRing
            value={carbs.current}
            max={carbs.target}
            label={t.carbs}
            color="carbs"
            size="sm"
          />
          <MacroRing
            value={fat.current}
            max={fat.target}
            label={t.fat}
            color="fat"
            size="sm"
          />
        </div>
      </motion.div>
    );
  }

  // Full variant - Compact & Modern
  return (
    <motion.div 
      className="p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Compact Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/15">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-primary">{t.today}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isOverCalories 
            ? `+${calories.current - calories.target} kcal`
            : `${calories.target - calories.current} kcal übrig`
          }
        </p>
      </div>

      {/* Calories Display - Compact */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-3xl font-bold tracking-tight ${isOverCalories ? 'text-red-400' : 'text-foreground'}`}>
          {calories.current}
        </span>
        <span className="text-base text-muted-foreground">/ {calories.target} kcal</span>
      </div>

      {/* Slim Progress Bar */}
      {showCalorieBar && (
        <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden mb-4">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isOverCalories 
                ? 'bg-red-500' 
                : 'bg-gradient-to-r from-primary to-emerald-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${caloriePercentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Compact Macro Row */}
      <div className="grid grid-cols-3 gap-3">
        <MacroRing
          value={protein.current}
          max={protein.target}
          label={t.protein}
          color="protein"
          size="sm"
        />
        <MacroRing
          value={carbs.current}
          max={carbs.target}
          label={t.carbs}
          color="carbs"
          size="sm"
        />
        <MacroRing
          value={fat.current}
          max={fat.target}
          label={t.fat}
          color="fat"
          size="sm"
        />
      </div>
    </motion.div>
  );
};
