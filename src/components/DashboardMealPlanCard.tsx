import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';
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
      className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 cursor-pointer hover:shadow-md transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <button className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
          {hasMealPlan ? 'Öffnen' : 'Erstellen'}
        </button>
      </div>
      
      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Wochenplan</p>
      
      {hasMealPlan ? (
        <>
          <p className="text-lg font-bold text-foreground mb-2">
            {totalCalories} <span className="text-sm font-normal text-muted-foreground">kcal heute</span>
          </p>
          
          {/* Week dots */}
          <div className="flex justify-between gap-1">
            {DAYS_SHORT.map((day, index) => {
              const isToday = index === getCurrentDayIndex();
              const hasMeals = mealPlan[index]?.meals?.length > 0;
              
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-medium ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {day}
                  </span>
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      isToday 
                        ? 'bg-emerald-500 ring-2 ring-emerald-500/30' 
                        : hasMeals 
                          ? 'bg-emerald-400/50' 
                          : 'bg-muted/40'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <p className="text-sm text-muted-foreground">Tippe zum Erstellen</p>
        </div>
      )}
    </motion.div>
  );
};
