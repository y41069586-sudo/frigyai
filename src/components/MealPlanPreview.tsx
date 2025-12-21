import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Utensils, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Meal {
  type: string;
  name: string;
  calories: number;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

const DAYS_MAP: Record<string, string> = {
  'Montag': 'Mo',
  'Dienstag': 'Di',
  'Mittwoch': 'Mi',
  'Donnerstag': 'Do',
  'Freitag': 'Fr',
  'Samstag': 'Sa',
  'Sonntag': 'So',
};

const getCurrentDayIndex = () => {
  const today = new Date().getDay();
  // Convert JS day (0=Sunday) to our format (0=Monday)
  return today === 0 ? 6 : today - 1;
};

export const MealPlanPreview = () => {
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DayPlan[];
        setMealPlan(parsed);
        
        // Find today's plan
        const currentDayIndex = getCurrentDayIndex();
        if (parsed[currentDayIndex]) {
          setTodayPlan(parsed[currentDayIndex]);
        }
      } catch (e) {
        console.error('Failed to load meal plan preview');
      }
    }
  }, []);

  const handleClick = () => {
    navigate('/meal-plans?tab=meals');
  };

  // No meal plan exists
  if (mealPlan.length === 0) {
    return (
      <motion.div
        onClick={handleClick}
        className="p-4 bg-card rounded-2xl border border-border/30 hover:border-primary/30 transition-all cursor-pointer active:scale-[0.99]"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400/20 to-amber-500/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Wochenplan erstellen</p>
            <p className="text-xs text-muted-foreground">KI-generierte Rezepte für dich</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
      </motion.div>
    );
  }

  // Show today's meals
  const totalCalories = todayPlan?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;

  return (
    <motion.div
      onClick={handleClick}
      className="p-4 bg-card rounded-2xl border border-border/30 hover:border-orange-500/30 transition-all cursor-pointer active:scale-[0.99]"
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-amber-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Heute</p>
            <p className="text-[10px] text-muted-foreground">{totalCalories} kcal geplant</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Meals Preview - Compact */}
      {todayPlan && todayPlan.meals.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {todayPlan.meals.slice(0, 2).map((meal, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{meal.name}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{meal.calories} kcal</span>
            </div>
          ))}
          {todayPlan.meals.length > 2 && (
            <p className="text-[10px] text-center text-muted-foreground">
              +{todayPlan.meals.length - 2} weitere Mahlzeiten
            </p>
          )}
        </div>
      )}

      {/* Week Overview - Clean Dots */}
      <div className="pt-3 border-t border-border/20">
        <div className="flex justify-between">
          {mealPlan.slice(0, 7).map((day, index) => {
            const shortDay = Object.values(DAYS_MAP)[index] || day.day.slice(0, 2);
            const isToday = index === getCurrentDayIndex();
            const hasMeals = day.meals && day.meals.length > 0;
            
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={`text-[9px] font-medium ${isToday ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {shortDay}
                </span>
                <div 
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    isToday 
                      ? 'bg-orange-500 ring-2 ring-orange-500/20' 
                      : hasMeals 
                        ? 'bg-primary/50' 
                        : 'bg-muted/40'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
