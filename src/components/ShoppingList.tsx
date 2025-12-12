import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Ingredient {
  name: string;
  amount: string;
  price: number;
}

interface ShoppingItem extends Ingredient {
  id: string;
  purchased: boolean;
}

interface ShoppingListProps {
  mealPlan: any[];
}

export const ShoppingList = ({ mealPlan }: ShoppingListProps) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    // Aggregate all ingredients from meal plan
    const ingredientMap = new Map<string, ShoppingItem>();
    
    mealPlan.forEach(day => {
      day.meals?.forEach((meal: any) => {
        meal.ingredients?.forEach((ing: Ingredient) => {
          const key = ing.name.toLowerCase();
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.price += ing.price;
          } else {
            ingredientMap.set(key, {
              ...ing,
              id: `${key}-${Date.now()}`,
              purchased: false,
            });
          }
        });
      });
    });

    setItems(Array.from(ingredientMap.values()));
  }, [mealPlan]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, purchased: !item.purchased } : item
    ));
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const purchasedPrice = items.filter(i => i.purchased).reduce((sum, item) => sum + item.price, 0);
  const purchasedCount = items.filter(i => i.purchased).length;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{t.shoppingListTitle}</p>
              <p className="text-sm text-muted-foreground">
                {purchasedCount} {t.ofGoal} {items.length} {t.ofPurchased}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">€{totalPrice.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              €{purchasedPrice.toFixed(2)} {t.spent}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-background/50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(purchasedCount / items.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </Card>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card 
              className={`p-3 cursor-pointer transition-all duration-200 ${
                item.purchased 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-card/60 border-primary/10 hover:border-primary/30'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={item.purchased}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="flex-1">
                  <p className={`font-medium ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.amount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${item.purchased ? 'text-muted-foreground' : 'text-primary'}`}>
                    €{item.price.toFixed(2)}
                  </span>
                  {item.purchased && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="p-8 text-center bg-card/60 border-primary/10">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t.generateMealPlanForList}</p>
        </Card>
      )}
    </div>
  );
};