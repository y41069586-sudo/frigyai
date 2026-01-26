import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChefHat, Clock, ArrowRight, Sparkles, Flame } from 'lucide-react';
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

const MEAL_ICONS: Record<string, any> = {
  'Frühstück': '🍳',
  'Mittagessen': '🍝',
  'Abendessen': '🍽️',
  'Snack': '🥗',
  'Vormittagssnack': '🍎',
  'Nachmittagssnack': '🍪',
};

const MEAL_COLORS: Record<string, string> = {
  'Frühstück': 'from-orange-500/20 to-amber-500/10',
  'Mittagessen': 'from-red-500/20 to-orange-500/10',
  'Abendessen': 'from-purple-500/20 to-pink-500/10',
  'Snack': 'from-green-500/20 to-emerald-500/10',
  'Vormittagssnack': 'from-yellow-500/20 to-orange-500/10',
  'Nachmittagssnack': 'from-blue-500/20 to-cyan-500/10',
};

const getCurrentDayIndex = () => {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
};

const getNextMeal = (meals: Meal[]): Meal | null => {
  const hour = new Date().getHours();
  if (hour < 10) return meals.find(m => m.type.includes('Frühstück')) || meals[0];
  if (hour < 14) return meals.find(m => m.type.includes('Mittag')) || meals[1];
  if (hour < 18) return meals.find(m => m.type.includes('Snack') || m.type.includes('snack')) || meals[2];
  return meals.find(m => m.type.includes('Abend')) || meals[meals.length - 1];
};

export const DashboardMealPlanCard = () => {
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClick = () => {
    navigate('/meal-plans?tab=meals');
  };

  const totalCalories = todayPlan?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  const hasMealPlan = mealPlan.length > 0;
  const nextMeal = todayPlan?.meals ? getNextMeal(todayPlan.meals) : null;
  const mealEmoji = nextMeal ? (MEAL_ICONS[nextMeal.type] || '🍽️') : '🍽️';
  const gradientColor = nextMeal ? (MEAL_COLORS[nextMeal.type] || 'from-emerald-500/20 to-emerald-500/10') : 'from-emerald-500/20 to-emerald-500/10';

  return (
    <motion.button
      onClick={handleClick}
      className="w-full relative overflow-hidden rounded-3xl cursor-pointer group text-left transition-all active:scale-95"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient based on meal */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} border border-foreground/5`} />
      
      {/* Animated decorative element */}
      <motion.div 
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: 'currentColor' }}
      />
      
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/30 dark:bg-white/5 rounded-xl backdrop-blur-sm">
              <ChefHat className="w-5 h-5 text-foreground/80" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground">Mahlplan</p>
              <p className="text-xs text-foreground/60">Heute</p>
            </div>
          </div>
          <motion.div
            className="p-1.5 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm"
            whileHover={{ x: 2 }}
          >
            <ArrowRight className="w-4 h-4 text-foreground/60" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {hasMealPlan && nextMeal ? (
            <motion.div
              key="has-plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              {/* Next meal feature */}
              <motion.div
                className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/10"
                whileHover={{ scale: 1.05 }}
              >
                <motion.span 
                  className="text-2xl flex-shrink-0"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  {mealEmoji}
                </motion.span>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                    {nextMeal.type}
                  </p>
                  <p className="text-sm font-bold text-foreground truncate leading-tight mt-0.5">
                    {nextMeal.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 dark:bg-white/10 rounded-lg flex-shrink-0">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-foreground">
                    {nextMeal.calories}
                  </span>
                </div>
              </motion.div>
              
              {/* Week overview dots */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Woche</p>
                <div className="flex items-center justify-between gap-1">
                  {DAYS_SHORT.map((day, index) => {
                    const isToday = index === getCurrentDayIndex();
                    const hasMeals = mealPlan[index]?.meals?.length > 0;
                    const isPast = index < getCurrentDayIndex();
                    
                    return (
                      <motion.button
                        key={day}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className="flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg transition-all"
                        style={{
                          background: isToday 
                            ? 'rgba(255,255,255,0.3)' 
                            : hasMeals 
                              ? 'rgba(255,255,255,0.1)' 
                              : 'transparent'
                        }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-all ${
                            isToday 
                              ? 'bg-foreground ring-2 ring-foreground/30' 
                              : hasMeals 
                                ? 'bg-foreground/50' 
                                : 'bg-foreground/20'
                          }`}
                        />
                        <span className={`text-[10px] font-semibold ${isToday ? 'text-foreground' : 'text-foreground/60'}`}>
                          {day}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : hasMealPlan ? (
            <motion.div
              key="plan-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-2"
            >
              <p className="text-sm font-semibold text-foreground/80">
                {totalCalories > 0 ? `${totalCalories} kcal heute` : 'Plan bereit'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="no-plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-2"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-foreground/60" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground/70">Jetzt erstellen</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
