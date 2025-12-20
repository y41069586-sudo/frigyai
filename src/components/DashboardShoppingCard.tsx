import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Check } from 'lucide-react';
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

  useEffect(() => {
    // Load shopping list from meal plan
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
      } catch (e) {
        console.error('Failed to parse meal plan');
      }
    }
  }, []);

  const handleClick = () => {
    navigate('/meal-plans?tab=shopping');
  };

  const progressPercent = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
  const hasItems = totalItems > 0;

  return (
    <motion.div
      onClick={handleClick}
      className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-2xl border border-violet-100 dark:border-violet-900/50 cursor-pointer hover:shadow-md transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <button className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
          Details
        </button>
      </div>
      
      <p className="text-violet-600 dark:text-violet-400 text-sm font-medium">Einkaufsliste</p>
      
      {hasItems ? (
        <>
          <p className="text-lg font-bold text-foreground">
            {purchasedItems}/{totalItems} <span className="text-sm font-normal text-muted-foreground">erledigt</span>
          </p>
          
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-violet-200/50 dark:bg-violet-900/30 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <Check className="w-4 h-4 text-violet-400" />
          <p className="text-sm text-muted-foreground">Aus Wochenplan</p>
        </div>
      )}
    </motion.div>
  );
};
