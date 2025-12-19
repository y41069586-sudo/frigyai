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
        className="p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Meal Plan</p>
            <p className="text-xs text-muted-foreground truncate">Tippe um zu erstellen</p>
          </div>
          <Sparkles className="w-4 h-4 text-orange-500" />
        </div>
      </motion.div>
    );
  }

  // Show today's meals
  const totalCalories = todayPlan?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;

  return (
    <motion.div
      onClick={handleClick}
      className="p-4 bg-card rounded-2xl border border-border/50 hover:border-orange-500/30 hover:shadow-md transition-all cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Heute</p>
            <p className="text-[10px] text-muted-foreground">{totalCalories} kcal geplant</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Meals Preview */}
      {todayPlan && (
        <div className="space-y-1.5">
          {todayPlan.meals.slice(0, 3).map((meal, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-6 h-6 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-3 h-3 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{meal.name}</p>
                <p className="text-[10px] text-muted-foreground">{meal.type} • {meal.calories} kcal</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Week Overview Mini */}
      <div className="mt-3 pt-3 border-t border-border/30">
        <div className="flex justify-between">
          {mealPlan.slice(0, 7).map((day, index) => {
            const shortDay = Object.values(DAYS_MAP)[index] || day.day.slice(0, 2);
            const isToday = index === getCurrentDayIndex();
            const hasMeals = day.meals && day.meals.length > 0;
            
            return (
              <div
                key={index}
                className={`flex flex-col items-center gap-1 ${isToday ? 'text-orange-500' : 'text-muted-foreground'}`}
              >
                <span className="text-[9px] font-medium">{shortDay}</span>
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isToday 
                      ? 'bg-orange-500' 
                      : hasMeals 
                        ? 'bg-primary/40' 
                        : 'bg-muted/50'
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
