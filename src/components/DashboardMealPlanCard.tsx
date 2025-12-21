import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, ArrowRight } from 'lucide-react';
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

const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const getCurrentDayIndex = () => {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
};

export const DashboardMealPlanCard = () => {
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DayPlan[];
        setMealPlan(parsed);
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

  const totalCalories = todayPlan?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  const hasMealPlan = mealPlan.length > 0;

  return (
    <motion.div
      onClick={handleClick}
      className="relative overflow-hidden p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/20 cursor-pointer group"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </div>
        
        <p className="text-sm font-semibold text-foreground mb-0.5">Wochenplan</p>
        
        {hasMealPlan ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {totalCalories > 0 ? `${totalCalories} kcal heute` : 'Plan erstellt'}
            </p>
            
            {/* Week indicator dots */}
            <div className="flex gap-1.5">
              {DAYS_SHORT.map((day, index) => {
                const isToday = index === getCurrentDayIndex();
                const hasMeals = mealPlan[index]?.meals?.length > 0;
                
                return (
                  <div
                    key={day}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isToday 
                        ? 'bg-emerald-500 ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-background' 
                        : hasMeals 
                          ? 'bg-emerald-500/40' 
                          : 'bg-muted/30'
                    }`}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 mt-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Jetzt erstellen</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
