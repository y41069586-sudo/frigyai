/** Ziel für Makro-Fokus in Mock-Generierung */
export type UserGoal = "lose" | "gain" | "maintain";

export interface MockIngredient {
  name: string;
  amount: string;
  price: number;
}

export interface MockMeal {
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: MockIngredient[];
  instructions: string[];
}

export interface MockDayPlan {
  day: string;
  meals: MockMeal[];
}

export interface ShoppingItem {
  name: string;
  amount: string;
  category: string;
}

export interface WeekPlanResult {
  days: MockDayPlan[];
  /** Nur fehlende Zutaten (Rezept minus Kühlschrank), aggregiert */
  shoppingList: ShoppingItem[];
  scanMeta?: { percentHave: number; eurosSaved: number };
}
