import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Check, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShoppingItem {
  name: string;
  purchased: boolean;
}

export const DashboardShoppingCard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState(0);

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
    navigate('/meal-plans?tab=shopping');
  };

  const progressPercent = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
  const hasItems = totalItems > 0;

  return (
    <motion.button
      onClick={handleClick}
      className="w-full relative overflow-hidden rounded-3xl cursor-pointer group text-left transition-all active:scale-95"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent border border-foreground/5" />
      
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
              <ShoppingBag className="w-5 h-5 text-foreground/80" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground">Einkaufen</p>
              <p className="text-xs text-foreground/60">Für die Woche</p>
            </div>
          </div>
          <motion.div
            className="p-1.5 rounded-lg bg-white/20 dark:bg-white/5 backdrop-blur-sm"
            whileHover={{ x: 2 }}
          >
            <ArrowRight className="w-4 h-4 text-foreground/60" />
          </motion.div>
        </div>

        {hasItems ? (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-foreground/60 font-medium uppercase tracking-wide">Fortschritt</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-foreground">{purchasedItems}</span>
                  <span className="text-xs text-foreground/60">/ {totalItems}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-foreground/60 font-medium uppercase tracking-wide">Fertig</p>
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {Math.round(progressPercent)}%
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-violet-200/30 dark:bg-violet-800/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-violet-500 via-violet-400 to-purple-500 rounded-full shadow-lg shadow-violet-500/20"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-3 space-x-2">
            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
              <Package className="w-4 h-4 text-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground/70">Bereit zum Einkaufen</p>
          </div>
        )}
      </div>
    </motion.button>
  );
};
