import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, ArrowRight, Utensils, Clock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

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
const MEAL_EMOJIS: Record<string, string> = {
  'Frühstück': '🍳',
  'Mittagessen': '🍝',
  'Abendessen': '🍽️',
  'Snack': '🥗',
  'Vormittagssnack': '🍎',
  'Nachmittagssnack': '🍪',
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
  const { isFreeMode, isPremium } = useAuth();
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);

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
    if (!isPremium) {
      setShowPremiumOverlay(true);
    } else {
      navigate('/meal-plans?tab=meals');
    }
  };

  const totalCalories = todayPlan?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  const hasMealPlan = mealPlan.length > 0;
  const nextMeal = todayPlan?.meals ? getNextMeal(todayPlan.meals) : null;
  const mealEmoji = nextMeal ? (MEAL_EMOJIS[nextMeal.type] || '🍽️') : '🍽️';

  return (
    <motion.div
      onClick={handleClick}
      className="relative overflow-hidden p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/20 cursor-pointer group min-h-[140px]"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >

      {/* Animated gradient blob */}
      <motion.div 
        className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </div>
        
        <p className="text-sm font-semibold text-foreground mb-1">Wochenplan</p>
        
        <AnimatePresence mode="wait">
          {hasMealPlan && nextMeal ? (
            <motion.div
              key="has-plan"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 5 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {/* Next meal highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 p-2 -mx-1 bg-emerald-500/10 rounded-xl"
              >
                <motion.span 
                  className="text-xl"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  {mealEmoji}
                </motion.span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {nextMeal.type}
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {nextMeal.name}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {nextMeal.calories}
                </span>
              </motion.div>
              
              {/* Week indicator dots - Full width */}
              <div className="flex gap-1.5 pt-2 -mx-1">
                {DAYS_SHORT.map((day, index) => {
                  const isToday = index === getCurrentDayIndex();
                  const hasMeals = mealPlan[index]?.meals?.length > 0;
                  const isPast = index < getCurrentDayIndex();

                  return (
                    <motion.div
                      key={day}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.04 + 0.3 }}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-all ${
                          isToday
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-background'
                            : isPast && hasMeals
                              ? 'bg-emerald-500/60'
                              : hasMeals
                                ? 'bg-emerald-500/30'
                                : 'bg-muted/20'
                        }`}
                      />
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-emerald-500' : 'text-muted-foreground/50'}`}>
                        {day}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : hasMealPlan ? (
            <motion.div
              key="plan-no-meals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              {totalCalories > 0 ? `${totalCalories} kcal heute` : 'Plan erstellt'}
            </motion.div>
          ) : (
            <motion.div
              key="no-plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-2"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </motion.div>
              <p className="text-xs text-muted-foreground">Jetzt erstellen</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Overlay */}
      {showPremiumOverlay && !isPremium && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <Crown className="h-12 w-12 text-amber-400" />
            <div className="text-center">
              <h3 className="font-bold text-white text-lg mb-1">Wochenplan freischalten</h3>
              <p className="text-sm text-white/70">
                Um den Wochenplan freizuschalten, kaufe Premium
              </p>
            </div>
            <div className="w-full flex flex-col gap-2">
              <Button
                className="w-full gradient-neon text-black font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/premium');
                }}
              >
                Zu Premium
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:text-white/80"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPremiumOverlay(false);
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
