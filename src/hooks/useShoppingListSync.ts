import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  price: number;
  purchased: boolean;
}

export const useShoppingListSync = () => {
  // Synchronisiere gescannte Zutaten mit der Einkaufsliste
  const syncWithScannedIngredients = useCallback((scannedIngredients: string[]) => {
    try {
      // Lade aktuelle Einkaufsliste aus localStorage
      const storedMealPlan = localStorage.getItem('weeklyMealPlan');
      if (!storedMealPlan) return { matchedItems: [], unmatchedItems: scannedIngredients };

      const mealPlan = JSON.parse(storedMealPlan);
      
      // Extrahiere alle Zutaten aus dem Wochenplan
      const shoppingItems: ShoppingItem[] = [];
      mealPlan.forEach((day: any) => {
        day.meals?.forEach((meal: any) => {
          meal.ingredients?.forEach((ing: any) => {
            const key = ing.name.toLowerCase();
            const existingIndex = shoppingItems.findIndex(item => 
              item.name.toLowerCase() === key
            );
            
            if (existingIndex === -1) {
              shoppingItems.push({
                id: `${key}-${Date.now()}`,
                name: ing.name,
                amount: ing.amount,
                price: ing.price || 0,
                purchased: false,
              });
            }
          });
        });
      });

      // Finde Übereinstimmungen zwischen gescannten Zutaten und Einkaufsliste
      const matchedItems: string[] = [];
      const normalizedScanned = scannedIngredients.map(ing => 
        ing.toLowerCase().replace(/\(.*?\)/g, '').trim()
      );

      const updatedItems = shoppingItems.map(item => {
        const itemName = item.name.toLowerCase();
        const isMatched = normalizedScanned.some(scanned => 
          itemName.includes(scanned) || scanned.includes(itemName) ||
          // Fuzzy matching für ähnliche Wörter
          itemName.split(' ').some(word => 
            scanned.split(' ').some(scannedWord => 
              word.length > 3 && scannedWord.length > 3 && 
              (word.includes(scannedWord) || scannedWord.includes(word))
            )
          )
        );

        if (isMatched && !item.purchased) {
          matchedItems.push(item.name);
          return { ...item, purchased: true };
        }
        return item;
      });

      // Speichere aktualisierte Liste
      if (matchedItems.length > 0) {
        // Speichere die abgehakten Items
        localStorage.setItem('shoppingListSyncedItems', JSON.stringify(matchedItems));
        
        toast({
          title: `${matchedItems.length} Zutat${matchedItems.length > 1 ? 'en' : ''} gefunden!`,
          description: `${matchedItems.slice(0, 3).join(', ')}${matchedItems.length > 3 ? '...' : ''} von der Einkaufsliste abgehakt.`,
        });
      }

      return {
        matchedItems,
        unmatchedItems: scannedIngredients.filter(ing => 
          !matchedItems.some(matched => 
            ing.toLowerCase().includes(matched.toLowerCase()) ||
            matched.toLowerCase().includes(ing.toLowerCase())
          )
        ),
      };
    } catch (e) {
      console.error('Error syncing shopping list:', e);
      return { matchedItems: [], unmatchedItems: scannedIngredients };
    }
  }, []);

  // Hole abgehakte Items für die Anzeige
  const getSyncedItems = useCallback(() => {
    try {
      const stored = localStorage.getItem('shoppingListSyncedItems');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Lösche Sync-Status
  const clearSyncedItems = useCallback(() => {
    localStorage.removeItem('shoppingListSyncedItems');
  }, []);

  return {
    syncWithScannedIngredients,
    getSyncedItems,
    clearSyncedItems,
  };
};
