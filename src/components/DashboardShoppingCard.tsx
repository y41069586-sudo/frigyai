import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Check, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ShoppingItem {
  name: string;
  purchased: boolean;
}

export const DashboardShoppingCard = () => {
  const navigate = useNavigate();
  const { isFreeMode, isPremium } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState(0);
  const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);

  const loadShoppingData = useCallback(() => {
    const savedPlan = localStorage.getItem('weeklyMealPlan');
    const savedItems = localStorage.getItem('shoppingListItems');
    
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        setItems(parsed);
        setTotalItems(parsed.length);
        setPurchasedItems(parsed.filter((i: ShoppingItem) => i.purchased).length);
        return;
      } catch (e) {
        console.error('Failed to load shopping list');
      }
    }
    
    // Calculate from meal plan if no saved items
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        const ingredientSet = new Set<string>();
        
        plan.forEach((day: any) => {
          day.meals?.forEach((meal: any) => {
            meal.ingredients?.forEach((ing: any) => {
              ingredientSet.add(ing.name.toLowerCase());
            });
          });
        });
        
        setTotalItems(ingredientSet.size);
        setPurchasedItems(0);
      } catch (e) {
        console.error('Failed to parse meal plan');
      }
    }
  }, []);

  useEffect(() => {
    loadShoppingData();
    
    // Listen for storage changes (realtime sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shoppingListItems' || e.key === 'weeklyMealPlan') {
        loadShoppingData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for same-tab updates
    const interval = setInterval(loadShoppingData, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [loadShoppingData]);

  const handleClick = () => {
    if (!isPremium) {
      setShowPremiumOverlay(true);
    } else {
      navigate('/meal-plans?tab=shopping');
    }
  };

  const progressPercent = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
  const hasItems = totalItems > 0;

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
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </div>
        
        <p className="text-sm font-semibold text-foreground mb-0.5">Einkaufsliste</p>
        
        {hasItems ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {purchasedItems}/{totalItems} erledigt
            </p>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-emerald-500/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 mt-1">
            <Check className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-xs text-muted-foreground">Aus Wochenplan</p>
          </div>
        )}
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
              <h3 className="font-bold text-white text-lg mb-1">Einkaufsliste freischalten</h3>
              <p className="text-sm text-white/70">
                Um die Einkaufsliste freizuschalten, kaufe Premium
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
