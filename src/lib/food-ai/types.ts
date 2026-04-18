/** Ziel für Makro-Fokus in Mock-Generierung */
export type UserGoal = "lose" | "gain" | "maintain";

export interface MockIngredient {
  name: string;
  amount: string;
  price: number;
}

export interface MockMeal {
  type: "Frühstück" | "Mittagessen" | "Abendessen";
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
  shoppingList: ShoppingItem[];
}
