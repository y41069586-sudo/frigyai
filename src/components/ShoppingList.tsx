import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, WifiOff, RefreshCw, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useLanguage, formatTranslation, type Translations } from '@/contexts/LanguageContext';
import { getAppLocale } from '@/lib/mealPlanLanguage';
import { toast } from '@/hooks/use-toast';
import { groupByCategory, getCategoryColor, getCategoryEmoji, IngredientCategory } from '@/lib/ingredient-categories';
import { FRIGY_STORAGE_UPDATED, notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import {
  normalizeShoppingName,
  readCheckedShoppingNames,
  writeCheckedShoppingNames,
} from '@/lib/shoppingSync';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  buildGapShoppingList,
  readFridgeIngredientsFromStorage,
} from '@/lib/shoppingGap';
import {
  formatShoppingListAmount,
} from '@/lib/shoppingListNormalize';
import { normalizeShoppingListItems } from '@/lib/shoppingListItems';

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

// Quick-add suggestions
const QUICK_SUGGESTIONS = [
  'Hähnchenbrust', 'Eier', 'Brokkoli', 'Magerquark', 'Haferflocken',
  'Milch', 'Bananen', 'Reis', 'Lachs', 'Spinat',
];

function getShoppingCategoryLabel(t: Translations, category: IngredientCategory): string {
  const labels: Record<IngredientCategory, string> = {
    'Obst & Gemüse': t.shoppingCategoryFruitVeg,
    'Fleisch & Fisch': t.shoppingCategoryMeatFish,
    Milchprodukte: t.shoppingCategoryDairy,
    'Brot & Getreide': t.shoppingCategoryBreadGrains,
    Pantry: t.shoppingCategoryPantry,
    Sonstiges: t.shoppingCategoryOther,
  };
  return labels[category] ?? category;
}

// ─── Swipeable Item ────────────────────────────────────────────────────────────
interface SwipeableItemProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
}

const SwipeableItem = ({ item, onToggle }: SwipeableItemProps) => {
  const x = useMotionValue(0);
  const hasTriggered = useRef(false);

  // Green check background fades in as user drags right
  const bgOpacity = useTransform(x, [0, 80], [0, 1]);
  const itemOpacity = useTransform(x, [0, 80], [1, 0.6]);

  const handleDragEnd = () => {
    if (x.get() > 80 && !hasTriggered.current) {
      hasTriggered.current = true;
      navigator.vibrate?.(10);
      onToggle(item.id);
    }
    // Spring snap-back
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    hasTriggered.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Green background revealed on swipe */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center pl-5"
        style={{ opacity: bgOpacity, backgroundColor: '#39D47F' }}
        aria-hidden
      >
        <Check className="h-5 w-5 text-white" strokeWidth={3} />
      </motion.div>

      {/* Item card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.1}
        style={{ x, opacity: item.purchased ? 0.5 : itemOpacity }}
        onDragEnd={handleDragEnd}
        onClick={() => onToggle(item.id)}
        className={`relative cursor-pointer touch-manipulation select-none rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors ${
          item.purchased
            ? 'bg-white/60 border-gray-100'
            : 'bg-white border-gray-100 hover:border-[#75FBB2]/60 active:bg-gray-50'
        }`}
      >
        {/* Custom circle checkbox */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            item.purchased
              ? 'bg-[#39D47F] border-[#39D47F]'
              : 'border-gray-300 bg-white'
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.id);
          }}
        >
          {item.purchased && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm truncate transition-all ${
              item.purchased
                ? 'line-through text-gray-400'
                : 'text-[#1F2937]'
            }`}
          >
            {item.name}
          </p>
          {item.amount && item.amount !== '—' && (
            <p className="text-xs text-[#6B7280] truncate mt-0.5">
              {formatShoppingListAmount(item.name, item.amount)}
            </p>
          )}
        </div>

        {item.price > 0 && (
          <span
            className={`flex-shrink-0 font-semibold text-sm ${
              item.purchased ? 'text-gray-400' : 'text-[#39D47F]'
            }`}
          >
            €{item.price.toFixed(2)}
          </span>
        )}
      </motion.div>
    </div>
  );
};

// ─── Quick Add Bar ─────────────────────────────────────────────────────────────
interface QuickAddBarProps {
  onAdd: (name: string) => void;
}

const QuickAddBar = ({ onAdd }: QuickAddBarProps) => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const filteredSuggestions = debounced.length > 0
    ? QUICK_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(debounced.toLowerCase())
      )
    : focused ? QUICK_SUGGESTIONS : [];

  const handleAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    inputRef.current?.blur();
  };

  return (
    <div className="mt-4">
      {/* Suggestion chips */}
      {filteredSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="flex flex-wrap gap-2 mb-3"
        >
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleAdd(s)}
              className="px-3 py-1 rounded-full bg-[#75FBB2]/20 border border-[#75FBB2]/40 text-xs font-medium text-[#1F2937] hover:bg-[#75FBB2]/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd(value);
          }}
          placeholder="Zutat hinzufügen…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder-gray-400 outline-none focus:border-[#75FBB2] focus:ring-2 focus:ring-[#75FBB2]/20 transition-all"
        />
        <button
          onClick={() => handleAdd(value)}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#39D47F] flex items-center justify-center hover:bg-[#2bbd70] transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const ShoppingList = ({ mealPlan }: ShoppingListProps) => {
  const { t, language } = useLanguage();
  const defaultIngredientName = t.ingredientDefaultName ?? 'Zutat';
  const isMobile = useIsMobile();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<IngredientCategory>>(
    new Set(['Obst & Gemüse', 'Fleisch & Fisch', 'Milchprodukte', 'Brot & Getreide', 'Pantry', 'Sonstiges'])
  );
  // Track which completed sections are collapsed (category label → bool)
  const [collapsedCompleted, setCollapsedCompleted] = useState<Set<string>>(new Set());
  const lastToggleAtRef = useRef<Record<string, number>>({});
  const locale = getAppLocale(language);

  // Offline-Status überwachen
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: t.shoppingListOfflineToastTitle,
        description: t.shoppingListOfflineToastDesc,
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

  const applyPurchasedFromCache = (base: ShoppingItem[]): ShoppingItem[] => {
    const checkedNames = readCheckedShoppingNames();
    const cachedItems = localStorage.getItem(OFFLINE_SHOPPING_LIST_KEY);
    const purchasedMap = new Map<string, boolean>();
    if (cachedItems) {
      try {
        const parsed = JSON.parse(cachedItems) as ShoppingItem[];
        parsed.forEach((item) => {
          purchasedMap.set(item.name.toLowerCase(), item.purchased);
        });
      } catch {
        /* ignore */
      }
    }
    return base.map((item) => ({
      ...item,
      purchased: checkedNames.has(normalizeShoppingName(item.name)) || purchasedMap.get(item.name.toLowerCase()) || false,
    }));
  };

  // Wochenplan ist Quelle der Wahrheit — Einkaufsliste daraus ableiten
  useEffect(() => {
    const mapGapToItems = (gap: Array<{ name: string; amount: string; price: number }>): ShoppingItem[] =>
      gap
        .filter((ing) => ing.name.trim().length > 0)
        .map((ing, idx) => ({
          name: ing.name,
          amount: formatShoppingListAmount(ing.name, ing.amount),
          price: typeof ing.price === 'number' ? ing.price : 0,
          id: `stored-${ing.name.toLowerCase()}-${idx}`,
          purchased: false,
        }));

    const tryStoredList = (): ShoppingItem[] | null => {
      const raw = localStorage.getItem('weeklyShoppingList');
      if (raw === null) return null;
      try {
        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeShoppingListItems(parsed, defaultIngredientName);
        if (!Array.isArray(parsed)) return null;
        if (normalized.length === 0) return [];
        return normalized.map((ing, idx) => ({
          name: ing.name,
          amount: formatShoppingListAmount(ing.name, ing.amount),
          price: typeof ing.price === 'number' ? ing.price : 0,
          id: `stored-${ing.name.toLowerCase()}-${idx}`,
          purchased: false,
        }));
      } catch {
        return null;
      }
    };

    if (isOffline && (!mealPlan || mealPlan.length === 0)) {
      const cached = localStorage.getItem(OFFLINE_SHOPPING_LIST_KEY);
      if (cached) {
        try {
          const parsedItems = JSON.parse(cached) as unknown;
          const normalized = normalizeShoppingListItems(parsedItems, defaultIngredientName);
          setItems(applyPurchasedFromCache(
            normalized.map((ing, idx) => ({
              name: ing.name,
              amount: formatShoppingListAmount(ing.name, ing.amount),
              price: ing.price,
              id: `offline-${ing.name.toLowerCase()}-${idx}`,
              purchased: false,
            })),
          ));
          return;
        } catch (e) {
          console.error('[SHOPPING] Failed to load cache:', e);
        }
      }
    }

    const fridge = readFridgeIngredientsFromStorage();

    if (mealPlan?.length) {
      const fromPlan = mapGapToItems(buildGapShoppingList(mealPlan, fridge));
      setItems(applyPurchasedFromCache(fromPlan));
      return;
    }

    const fromStorage = tryStoredList();
    if (fromStorage !== null) {
      setItems(applyPurchasedFromCache(fromStorage));
      return;
    }

    setItems([]);
  }, [mealPlan, isOffline, defaultIngredientName]);

  useEffect(() => {
    const onStorage = () => {
      if (mealPlan?.length) {
        const fromPlan = buildGapShoppingList(mealPlan, readFridgeIngredientsFromStorage()).map(
          (ing, idx) => ({
            name: ing.name,
            amount: ing.amount || '—',
            price: ing.price,
            id: `stored-${ing.name.toLowerCase()}-${idx}`,
            purchased: false,
          }),
        );
        setItems(applyPurchasedFromCache(fromPlan));
        return;
      }

      const raw = localStorage.getItem('weeklyShoppingList');
      if (raw === null) return;
      try {
        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeShoppingListItems(parsed, defaultIngredientName);
        if (!Array.isArray(parsed) || normalized.length === 0) return;
        const withIds: ShoppingItem[] = normalized.map((ing, idx) => ({
          name: ing.name,
          amount: ing.amount || '—',
          price: typeof ing.price === 'number' ? ing.price : 0,
          id: `stored-${ing.name.toLowerCase()}-${idx}`,
          purchased: false,
        }));
        setItems(applyPurchasedFromCache(withIds));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(FRIGY_STORAGE_UPDATED, onStorage);
    return () => window.removeEventListener(FRIGY_STORAGE_UPDATED, onStorage);
  }, [defaultIngredientName, mealPlan]);

  // Auto-save bei Änderungen
  const saveToCache = useCallback((itemsToCache: ShoppingItem[]) => {
    try {
      localStorage.setItem(OFFLINE_SHOPPING_LIST_KEY, JSON.stringify(itemsToCache));
      const timestamp = new Date().toLocaleString(locale);
      localStorage.setItem(SHOPPING_LIST_TIMESTAMP_KEY, timestamp);
      setLastSyncTime(timestamp);
    } catch (e) {
      console.error('[SHOPPING] Failed to save cache:', e);
    }
  }, [locale]);

  useEffect(() => {
    if (items.length > 0) {
      saveToCache(items);
    }
  }, [items, saveToCache]);

  const updatePurchasedState = useCallback((id: string, purchased: boolean | ((current: boolean) => boolean)) => {
    const now = Date.now();
    const lastToggleAt = lastToggleAtRef.current[id] ?? 0;
    if (now - lastToggleAt < 160) return;
    lastToggleAtRef.current[id] = now;

    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const nextPurchased = typeof purchased === 'function' ? purchased(item.purchased) : purchased;
        return { ...item, purchased: nextPurchased };
      });
      const nextCheckedNames = new Set(
        next.filter((item) => item.purchased).map((item) => normalizeShoppingName(item.name)),
      );
      writeCheckedShoppingNames(nextCheckedNames);
      notifyFrigyStorageUpdated();
      return next;
    });
  }, []);

  const toggleItem = (id: string) => {
    updatePurchasedState(id, (current) => !current);
  };

  const toggleCategory = (category: IngredientCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  const toggleCollapsedCompleted = (key: string) => {
    setCollapsedCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Add a manually typed item
  const addManualItem = (name: string) => {
    const id = `manual-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newItem: ShoppingItem = { id, name, amount: '', price: 0, purchased: false };
    setItems((prev) => [newItem, ...prev]);
  };

  // Delete all completed items
  const clearCompleted = () => {
    setItems((prev) => {
      const next = prev.filter((i) => !i.purchased);
      const nextCheckedNames = new Set(
        next.filter((item) => item.purchased).map((item) => normalizeShoppingName(item.name)),
      );
      writeCheckedShoppingNames(nextCheckedNames);
      notifyFrigyStorageUpdated();
      return next;
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

  // Keep findMatchingItems for external use / future scanning features
  const findMatchingItems = (detectedIngredient: string): ShoppingItem[] => {
    const normalized = detectedIngredient.toLowerCase().trim();
    return items.filter((item) => {
      const itemName = item.name.toLowerCase();
      if (itemName === normalized) return true;
      if (itemName.includes(normalized) || normalized.includes(itemName)) return true;
      return calculateStringSimilarity(normalized, itemName) > 0.7;
    });
  };
  // Suppress unused warning in strict mode
  void findMatchingItems;

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const purchasedPrice = items.filter((i) => i.purchased).reduce((sum, item) => sum + item.price, 0);
  const remainingPrice = totalPrice - purchasedPrice;
  const purchasedCount = items.filter((i) => i.purchased).length;
  const progressPct = items.length ? (purchasedCount / items.length) * 100 : 0;

  const forceSync = () => {
    saveToCache(items);
    toast({
      title: t.shoppingListOfflineSavedTitle,
      description: t.shoppingListOfflineSavedDesc,
    });
  };

  const groups = groupByCategory(items);

  return (
    <div className="space-y-4 pb-8">
      {/* Offline-Banner */}
      {isOffline && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <WifiOff className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-700">{t.shoppingListOfflineMode}</p>
            <p className="text-xs text-amber-600 truncate">
              {lastSyncTime ? `${t.shoppingListLastSaved}: ${lastSyncTime}` : t.shoppingListCacheLoaded}
            </p>
          </div>
          <button onClick={forceSync} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4 text-amber-500 hover:text-amber-700 transition-colors" />
          </button>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#75FBB2]/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-[#39D47F]" />
            </div>
            <div>
              <p className="font-semibold text-[#1F2937]">{t.shoppingListTitle}</p>
              <p className="text-xs text-[#6B7280]">
                {purchasedCount} {t.ofGoal} {items.length} {t.ofPurchased}
              </p>
            </div>
          </div>
          {totalPrice > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold text-[#1F2937]">€{totalPrice.toFixed(2)}</p>
              <div className="text-xs text-[#6B7280] space-y-0.5">
                <p>€{purchasedPrice.toFixed(2)} {t.spent}</p>
                {remainingPrice > 0 && (
                  <p className="text-amber-600 font-medium">€{remainingPrice.toFixed(2)} {t.shoppingListStillNeeded}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-[#75FBB2]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Expand / collapse controls */}
        {items.length > 0 && (
          <div className="flex gap-2 text-xs">
            <button
              onClick={() =>
                setExpandedCategories(
                  new Set(['Obst & Gemüse', 'Fleisch & Fisch', 'Milchprodukte', 'Brot & Getreide', 'Pantry', 'Sonstiges'])
                )
              }
              className="px-3 py-1.5 rounded-lg bg-gray-50 text-[#6B7280] hover:bg-gray-100 transition-colors font-medium"
            >
              {t.shoppingListShowAll}
            </button>
            <button
              onClick={() => setExpandedCategories(new Set())}
              className="px-3 py-1.5 rounded-lg bg-gray-50 text-[#6B7280] hover:bg-gray-100 transition-colors font-medium"
            >
              {t.shoppingListCollapseAll}
            </button>
          </div>
        )}

        {/* Sync timestamp */}
        {lastSyncTime && !isOffline && (
          <p className="text-xs text-[#6B7280] mt-3">
            {t.shoppingListLastSaved}: {lastSyncTime}
          </p>
        )}
      </div>

      {/* "Aus Plan importieren" — shown prominently when list is empty */}
      {items.length === 0 && mealPlan?.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-[#75FBB2]/60 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#75FBB2]/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-[#39D47F]" />
          </div>
          <p className="font-medium text-[#1F2937] mb-1">{t.generateMealPlanForList}</p>
          <p className="text-sm text-[#6B7280]">
            Füge Zutaten hinzu oder lass den Wochenplan sie importieren
          </p>
        </div>
      )}

      {/* Grouped items */}
      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedCategories.has(group.category);
            const unchecked = group.items.filter((i) => !i.purchased);
            const checked = group.items.filter((i) => i.purchased);
            const categoryTotalPrice = group.items.reduce((sum, item) => sum + item.price, 0);
            const completedKey = group.category;
            const completedCollapsed = collapsedCompleted.has(completedKey);

            return (
              <div key={group.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{getCategoryEmoji(group.category)}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#1F2937]">
                        {getShoppingCategoryLabel(t, group.category)}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {checked.length} {t.shoppingListOfCount} {group.items.length}
                        {categoryTotalPrice > 0 && ` · €${categoryTotalPrice.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#6B7280]"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {/* Unchecked items */}
                    {unchecked.map((item) => (
                      <SwipeableItem key={item.id} item={item} onToggle={toggleItem} />
                    ))}

                    {/* Completed sub-section */}
                    {checked.length > 0 && (
                      <div className="pt-1">
                        <button
                          onClick={() => toggleCollapsedCompleted(completedKey)}
                          className="w-full flex items-center gap-2 px-1 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#1F2937] transition-colors"
                        >
                          <span>
                            {checked.length} erledigt
                          </span>
                          <motion.div
                            animate={{ rotate: completedCollapsed ? 0 : 180 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </motion.div>
                        </button>
                        {!completedCollapsed && (
                          <div className="space-y-2">
                            {checked.map((item) => (
                              <SwipeableItem key={item.id} item={item} onToggle={toggleItem} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick-add bar */}
      {(items.length > 0 || mealPlan?.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <QuickAddBar onAdd={addManualItem} />
        </div>
      )}

      {/* Empty state when plan exists but no gaps */}
      {items.length === 0 && (mealPlan?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#75FBB2]/20 flex items-center justify-center mx-auto mb-3">
            <Check className="h-6 w-6 text-[#39D47F]" />
          </div>
          <p className="font-medium text-[#1F2937] mb-1">Alles im Kühlschrank!</p>
          <p className="text-sm text-[#6B7280]">
            {t.mealPlans}: {formatTranslation(t.shoppingListDayCount, { count: mealPlan.length })}
          </p>
        </div>
      )}

      {/* Floating "clear completed" button */}
      {purchasedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={clearCompleted}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1F2937] text-white text-sm font-medium shadow-lg hover:bg-gray-800 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Alle erledigt löschen ({purchasedCount})
          </button>
        </motion.div>
      )}
    </div>
  );
};
