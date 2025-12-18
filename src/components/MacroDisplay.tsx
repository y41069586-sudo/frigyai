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

  // Full variant
  return (
    <motion.div 
      className="p-6 rounded-3xl bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border border-border/50 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Calories Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t.today}</span>
        </div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className={`text-5xl font-bold ${isOverCalories ? 'text-red-400' : 'text-foreground'}`}>
            {calories.current}
          </span>
          <span className="text-xl text-muted-foreground"> / {calories.target}</span>
          <p className="text-sm text-muted-foreground mt-1">kcal</p>
        </motion.div>
      </div>

      {/* Calorie Progress Bar */}
      {showCalorieBar && (
        <div className="relative h-4 bg-muted/20 rounded-full overflow-hidden mb-8">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isOverCalories 
                ? 'bg-gradient-to-r from-red-500 to-red-400' 
                : 'bg-gradient-to-r from-primary via-green-400 to-emerald-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${caloriePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full blur-sm ${
              isOverCalories ? 'bg-red-500/50' : 'bg-primary/50'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${caloriePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Macro Rings */}
      <div className="grid grid-cols-3 gap-4">
        <MacroRing
          value={protein.current}
          max={protein.target}
          label={t.protein}
          color="protein"
          size="md"
        />
        <MacroRing
          value={carbs.current}
          max={carbs.target}
          label={t.carbs}
          color="carbs"
          size="md"
        />
        <MacroRing
          value={fat.current}
          max={fat.target}
          label={t.fat}
          color="fat"
          size="md"
        />
      </div>

      {/* Remaining calories hint */}
      <motion.p 
        className="text-center text-sm text-muted-foreground mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isOverCalories 
          ? `${calories.current - calories.target} kcal über dem Ziel`
          : `${calories.target - calories.current} kcal verbleibend`
        }
      </motion.p>
    </motion.div>
  );
};
