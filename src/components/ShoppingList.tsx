import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Scan, WifiOff, RefreshCw, ChevronDown, Refrigerator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { groupByCategory, getCategoryColor, getCategoryEmoji, IngredientCategory } from '@/lib/ingredient-categories';

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

const OFFLINE_SHOPPING_LIST_KEY = 'frigai_offline_shopping_list';
const SHOPPING_LIST_TIMESTAMP_KEY = 'frigai_shopping_list_timestamp';

export const ShoppingList = ({ mealPlan }: ShoppingListProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<IngredientCategory>>(new Set(['Obst & Gemüse', 'Fleisch & Fisch', 'Milchprodukte', 'Brot & Getreide', 'Pantry', 'Sonstiges']));

  // Offline-Status überwachen
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "📴 Offline-Modus",
        description: "Einkaufsliste ist weiterhin verfügbar!",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache laden beim Start
  useEffect(() => {
    const cachedTimestamp = localStorage.getItem(SHOPPING_LIST_TIMESTAMP_KEY);
    if (cachedTimestamp) {
      setLastSyncTime(cachedTimestamp);
    }
  }, []);

  // Einkaufsliste aus MealPlan generieren ODER aus Cache laden
  useEffect(() => {
    // Wenn offline und kein MealPlan, lade aus Cache
    if (isOffline && (!mealPlan || mealPlan.length === 0)) {
      const cached = localStorage.getItem(OFFLINE_SHOPPING_LIST_KEY);
      if (cached) {
        try {
          const parsedItems = JSON.parse(cached);
          setItems(parsedItems);
          console.log('[SHOPPING] Loaded from offline cache:', parsedItems.length, 'items');
          return;
        } catch (e) {
          console.error('[SHOPPING] Failed to load cache:', e);
        }
      }
    }

    // Normale Generierung aus MealPlan
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
              id: `${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              purchased: false,
            });
          }
        });
      });
    });

    // Lade purchased-Status aus Cache
    const cachedItems = localStorage.getItem(OFFLINE_SHOPPING_LIST_KEY);
    let purchasedMap = new Map<string, boolean>();
    if (cachedItems) {
      try {
        const parsed = JSON.parse(cachedItems) as ShoppingItem[];
        parsed.forEach(item => {
          purchasedMap.set(item.name.toLowerCase(), item.purchased);
        });
      } catch (e) {
        console.warn('Failed to parse cached shopping list:', e);
      }
    }

    // Merge: Behalte purchased-Status aus Cache
    const newItems = Array.from(ingredientMap.values()).map(item => ({
      ...item,
      purchased: purchasedMap.get(item.name.toLowerCase()) || false,
    }));

    setItems(newItems);
  }, [mealPlan, isOffline]);

  // Einkaufsliste im Cache speichern bei jeder Änderung
  const saveToCache = useCallback((itemsToCache: ShoppingItem[]) => {
    try {
      localStorage.setItem(OFFLINE_SHOPPING_LIST_KEY, JSON.stringify(itemsToCache));
      const timestamp = new Date().toLocaleString('de-DE');
      localStorage.setItem(SHOPPING_LIST_TIMESTAMP_KEY, timestamp);
      setLastSyncTime(timestamp);
      console.log('[SHOPPING] Saved to cache:', itemsToCache.length, 'items');
    } catch (e) {
      console.error('[SHOPPING] Failed to save cache:', e);
    }
  }, []);

  // Auto-save bei Änderungen
  useEffect(() => {
    if (items.length > 0) {
      saveToCache(items);
    }
  }, [items, saveToCache]);

  const setPurchased = (id: string, purchased: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, purchased } : item))
    );
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, purchased: !item.purchased } : item
      )
    );
  };

  const toggleCategory = (category: IngredientCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  /**
   * Smart ingredient matching: compares detected ingredient with shopping list
   * Uses fuzzy matching to find similar ingredients
   */
  const findMatchingItems = (detectedIngredient: string): ShoppingItem[] => {
    const normalized = detectedIngredient.toLowerCase().trim();

    return items.filter(item => {
      const itemName = item.name.toLowerCase();

      // Exact match
      if (itemName === normalized) return true;

      // Substring match (e.g., "Eier" matches "Eier (3 Stück)")
      if (itemName.includes(normalized) || normalized.includes(itemName)) return true;

      // Similar enough match (at least 70% similar)
      const similarity = calculateStringSimilarity(normalized, itemName);
      return similarity > 0.7;
    });
  };

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  const calculateStringSimilarity = (a: string, b: string): number => {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  /**
   * Calculate Levenshtein distance between two strings
   */
  const getEditDistance = (a: string, b: string): number => {
    const costs: number[] = [];
    for (let i = 0; i <= a.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (a.charAt(i - 1) !== b.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[b.length] = lastValue;
    }
    return costs[b.length];
  };

  /**
   * Handle fridge scan - navigates to camera/scan page with OpenAI-powered ingredient detection
   */
  const handleFridgeScan = () => {
    navigate('/scan');
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const purchasedPrice = items
    .filter((i) => i.purchased)
    .reduce((sum, item) => sum + item.price, 0);
  const remainingPrice = totalPrice - purchasedPrice;
  const purchasedCount = items.filter((i) => i.purchased).length;
  const progressPct = items.length ? (purchasedCount / items.length) * 100 : 0;

  // Get unpurchased items for ordering
  const unpurchasedItems = items.filter((i) => !i.purchased).map((i) => i.name);

  // Manuelles Sync zum Cache
  const forceSync = () => {
    saveToCache(items);
    toast({
      title: "✅ Offline gespeichert!",
      description: "Einkaufsliste ist jetzt im Supermarkt ohne Internet verfügbar.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Offline-Banner */}
      {isOffline && (
        <Card className="p-3 bg-amber-500/20 border-amber-500/50 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-amber-500" />
          <div className="flex-1">
            <p className="font-medium text-amber-500">Offline-Modus aktiv</p>
            <p className="text-xs text-muted-foreground">
              {lastSyncTime ? `Zuletzt gespeichert: ${lastSyncTime}` : 'Daten aus Cache geladen'}
            </p>
          </div>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="flex items-center justify-between mb-3">
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
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p>€{purchasedPrice.toFixed(2)} {t.spent}</p>
              {remainingPrice > 0 && (
                <p className="text-amber-600 font-medium">€{remainingPrice.toFixed(2)} noch nötig</p>
              )}
            </div>
          </div>
        </div>

        {/* Expand/Collapse All Controls */}
        {items.length > 0 && (
          <div className="flex gap-2 mb-3 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCategories(new Set(['Obst & Gemüse', 'Fleisch & Fisch', 'Milchprodukte', 'Brot & Getreide', 'Pantry', 'Sonstiges']))}
              className="h-7 text-xs"
            >
              Alle anzeigen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCategories(new Set())}
              className="h-7 text-xs"
            >
              Alle minimieren
            </Button>
          </div>
        )}
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-background/50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {/* Offline Sync Button */}
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={forceSync}
          >
            <RefreshCw className="h-4 w-4" />
            Für Offline speichern
          </Button>

          {/* Fridge Scan Button */}
          {items.length > 0 && (
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              onClick={handleFridgeScan}
              variant="default"
            >
              <Refrigerator className="h-4 w-4" />
              <span className="hidden sm:inline">Kühlschrank scannen</span>
            </Button>
          )}
        </div>

        {/* Sync Status */}
        {lastSyncTime && !isOffline && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Zuletzt gespeichert: {lastSyncTime}
          </p>
        )}
      </Card>

      {/* Items List - Grouped by Category */}
      <div className="space-y-4">
        {groupByCategory(items).map((group) => {
          const isExpanded = expandedCategories.has(group.category);
          const categoryPurchasedCount = group.items.filter(i => i.purchased).length;
          const categoryTotalPrice = group.items.reduce((sum, item) => sum + item.price, 0);

          return (
            <div key={group.category} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(group.category)}
                className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${getCategoryColor(group.category)}`}
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-xl">{getCategoryEmoji(group.category)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{group.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryPurchasedCount} von {group.items.length} • €{categoryTotalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>

              {/* Category Items */}
              <motion.div
                initial={false}
                animate={{
                  height: isExpanded ? 'auto' : 0,
                  opacity: isExpanded ? 1 : 0,
                  marginBottom: isExpanded ? 16 : 0
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-2"
              >
                {group.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card
                      className={`p-3 cursor-pointer touch-manipulation select-none transition-all duration-200 ${
                        item.purchased
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-card/60 border-primary/10 hover:border-primary/30'
                      }`}
                      onPointerUp={() => toggleItem(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.purchased}
                          onCheckedChange={(checked) => setPurchased(item.id, checked === true)}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${item.purchased ? 'text-muted-foreground' : 'text-primary'}`}>
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
              </motion.div>
            </div>
          );
        })}
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
