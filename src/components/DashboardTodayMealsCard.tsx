import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Flame, Beef, Wheat, Droplets, Plus } from 'lucide-react';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';

interface LoggedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DashboardTodayMealsCard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { entries, todayTotals } = useFoodEntries();
  const { settings: trackerSettings } = useTrackerSettings();
  const [todayMealPlan, setTodayMealPlan] = useState<LoggedMeal[]>([]);

  useEffect(() => {
    // Load today's meal plan from localStorage
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        const mealPlan = JSON.parse(saved);
        const today = new Date();
        const dayIndex = today.getDay();
        const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        
        const todayPlan = mealPlan.find((day: any) => day.day.toLowerCase() === dayNames[dayIndex].toLowerCase());
        if (todayPlan?.meals) {
          setTodayMealPlan(todayPlan.meals);
        }
      } catch (e) {
        console.error('Failed to load meal plan:', e);
      }
    }
  }, []);

  // Use tracker settings as the source of truth for daily calorie target
  // This ensures the widget always shows the current tracker goal, not an old meal plan value
  const targetCalories = trackerSettings?.dailyCalories || 0;

  if (!targetCalories) {
    return null;
  }

  const plannedCalories = todayMealPlan.reduce((sum, meal) => sum + meal.calories, 0);
  const progress = targetCalories > 0 ? Math.min((todayTotals.calories / targetCalories) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="p-4 bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20 hover:shadow-neon transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Heute gegessen</h3>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Kalorienziel</span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(todayTotals.calories)} / {targetCalories} kcal
            </span>
          </div>
          <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <Beef className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <p className="text-xs font-semibold">{Math.round(todayTotals.protein)}g</p>
            <p className="text-[10px] text-muted-foreground">Protein</p>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <Wheat className="h-4 w-4 mx-auto text-amber-500 mb-1" />
            <p className="text-xs font-semibold">{Math.round(todayTotals.carbs)}g</p>
            <p className="text-[10px] text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <Droplets className="h-4 w-4 mx-auto text-blue-500 mb-1" />
            <p className="text-xs font-semibold">{Math.round(todayTotals.fat)}g</p>
            <p className="text-[10px] text-muted-foreground">Fett</p>
          </div>
        </div>

        {/* Meals list */}
        <div className="space-y-2 mb-4">
          {entries.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-3">
              Noch keine Mahlzeiten gegessen heute
            </p>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 3).map((meal, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-2 bg-background/40 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{meal.name}</span>
                  </div>
                  <span className="text-xs text-primary font-semibold ml-2">{meal.calories} kcal</span>
                </motion.div>
              ))}
              {entries.length > 3 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  + {entries.length - 3} weitere
                </p>
              )}
            </div>
          )}
        </div>

        {/* Add Food Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-10 flex items-center justify-center gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Essen hinzufügen</span>
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};
