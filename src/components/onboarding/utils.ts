import { UserData } from "./types";

// Macro calculation using Mifflin-St Jeor BMR formula
export const calculateMacros = (userData: UserData) => {
  const { weight, height, age, gender, activityLevel, goalMode, weeklyGoal } = userData;
  
  // Mifflin-St Jeor BMR formula with gender-specific constants
  const genderConstant = gender === 'female' ? -161 : 5;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderConstant;
  
  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    low: 1.2,
    medium: 1.55,
    high: 1.9
  };
  
  const tdee = bmr * (activityMultipliers[activityLevel || 'medium'] || 1.55);
  
  // Calculate calorie change based on weekly goal
  // 1kg of body weight = ~7700 kcal
  // Daily change = weeklyGoal * 7700 / 7 = weeklyGoal * 1100 kcal/day
  const dailyCalorieChange = weeklyGoal * 1100;
  
  let dailyCalories: number;
  if (goalMode === 'lose') {
    dailyCalories = tdee - dailyCalorieChange;
  } else {
    dailyCalories = tdee + dailyCalorieChange;
  }
  
  // Apply minimum calorie floors based on age
  const minCalories = age < 25 ? 1500 : age < 40 ? 1400 : 1300;
  dailyCalories = Math.max(dailyCalories, minCalories);
  dailyCalories = Math.round(dailyCalories);
  
  // Calculate macros
  const dailyProtein = Math.round(weight * 2);
  const dailyFat = Math.round(weight * 0.9);
  const proteinCalories = dailyProtein * 4;
  const fatCalories = dailyFat * 9;
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const dailyCarbs = Math.max(50, Math.round(remainingCalories / 4));
  
  return { dailyCalories, dailyProtein, dailyCarbs, dailyFat };
};

// Calculate weeks to reach goal
export const calculateWeeksToGoal = (userData: UserData) => {
  const weightDiff = Math.abs(userData.targetWeight - userData.weight);
  return Math.ceil(weightDiff / userData.weeklyGoal);
};

// Save onboarding data to localStorage and generate initial meal plan
export const saveOnboardingData = (userData: UserData) => {
  localStorage.setItem('onboardingUserData', JSON.stringify(userData));
  localStorage.setItem('onboardingComplete', 'true');
  
  // Save user name for personalized greetings
  if (userData.name) {
    localStorage.setItem('userName', userData.name);
  }
  
  // Calculate macros if not set
  const calculatedMacros = calculateMacros(userData);
  const dailyCalories = userData.dailyCalories || calculatedMacros.dailyCalories;
  const dailyProtein = userData.dailyProtein || calculatedMacros.dailyProtein;
  const dailyCarbs = userData.dailyCarbs || calculatedMacros.dailyCarbs;
  const dailyFat = userData.dailyFat || calculatedMacros.dailyFat;
  
  const trackerSettings = {
    age: userData.age,
    height: userData.height,
    weight: userData.weight,
    gender: userData.gender,
    targetWeight: userData.targetWeight,
    goalMode: userData.goalMode,
    weeklyGoal: userData.weeklyGoal,
    dailyCalories,
    dailyProtein,
    dailyCarbs,
    dailyFat,
    dietaryPreferences: userData.dietaryPreferences,
    allergies: userData.allergies,
    cookingExperience: userData.cookingExperience,
    cookingTime: userData.cookingTime,
    notificationPrefs: userData.notificationPrefs,
  };
  localStorage.setItem('userProfile', JSON.stringify(trackerSettings));
  
  // Generate and save initial meal plan based on user's macros
  const initialMealPlan = generateInitialMealPlan(dailyCalories);
  localStorage.setItem('weeklyMealPlan', JSON.stringify(initialMealPlan));
  
  // Set generation count to 0 - user gets 1 free regeneration
  localStorage.setItem('mealPlanGenerationCount', '0');
};

// Generate an initial personalized meal plan
const generateInitialMealPlan = (targetCalories: number) => {
  const breakfastCal = Math.round(targetCalories * 0.25);
  const snack1Cal = Math.round(targetCalories * 0.1);
  const lunchCal = Math.round(targetCalories * 0.3);
  const snack2Cal = Math.round(targetCalories * 0.1);
  const dinnerCal = Math.round(targetCalories * 0.25);
  
  const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  
  const mealOptions = {
    breakfast: [
      { name: "Haferflocken mit Beeren", protein: 12, carbs: 55, fat: 8, prepTime: 10, ingredients: [{ name: "Haferflocken", amount: "60g", price: 0.30 }, { name: "Beeren", amount: "100g", price: 1.50 }, { name: "Milch", amount: "200ml", price: 0.40 }], instructions: ["Haferflocken mit Milch kochen", "Mit Beeren toppen"] },
      { name: "Rührei mit Toast", protein: 20, carbs: 30, fat: 20, prepTime: 15, ingredients: [{ name: "Eier", amount: "3 Stück", price: 0.90 }, { name: "Vollkorntoast", amount: "2 Scheiben", price: 0.40 }], instructions: ["Eier verrühren und braten", "Mit Toast servieren"] },
      { name: "Smoothie Bowl", protein: 10, carbs: 50, fat: 10, prepTime: 10, ingredients: [{ name: "Gefrorene Beeren", amount: "150g", price: 1.50 }, { name: "Banane", amount: "1 Stück", price: 0.30 }, { name: "Granola", amount: "30g", price: 0.60 }], instructions: ["Beeren und Banane mixen", "Mit Granola toppen"] },
      { name: "Vollkornbrot mit Avocado", protein: 10, carbs: 35, fat: 18, prepTime: 8, ingredients: [{ name: "Vollkornbrot", amount: "2 Scheiben", price: 0.50 }, { name: "Avocado", amount: "0.5 Stück", price: 1.00 }], instructions: ["Avocado zerdrücken", "Auf Brot verteilen"] },
      { name: "Joghurt mit Müsli", protein: 15, carbs: 45, fat: 12, prepTime: 5, ingredients: [{ name: "Griechischer Joghurt", amount: "200g", price: 1.50 }, { name: "Müsli", amount: "50g", price: 0.60 }], instructions: ["Joghurt in Schüssel geben", "Mit Müsli toppen"] },
      { name: "Protein-Pancakes", protein: 25, carbs: 40, fat: 10, prepTime: 20, ingredients: [{ name: "Haferflocken", amount: "50g", price: 0.25 }, { name: "Eier", amount: "2 Stück", price: 0.60 }, { name: "Banane", amount: "1 Stück", price: 0.30 }], instructions: ["Alle Zutaten mixen", "In Pfanne ausbacken"] },
      { name: "Chia-Pudding", protein: 8, carbs: 35, fat: 15, prepTime: 5, ingredients: [{ name: "Chiasamen", amount: "30g", price: 0.80 }, { name: "Mandelmilch", amount: "200ml", price: 0.70 }, { name: "Honig", amount: "1 EL", price: 0.30 }], instructions: ["Chiasamen mit Milch mischen", "Über Nacht quellen lassen"] },
    ],
    snack: [
      { name: "Griechischer Joghurt", protein: 15, carbs: 8, fat: 6, prepTime: 2, ingredients: [{ name: "Griechischer Joghurt", amount: "150g", price: 1.20 }], instructions: ["Joghurt in eine Schüssel geben"] },
      { name: "Apfel mit Mandeln", protein: 5, carbs: 22, fat: 9, prepTime: 2, ingredients: [{ name: "Apfel", amount: "1 Stück", price: 0.50 }, { name: "Mandeln", amount: "20g", price: 0.80 }], instructions: ["Apfel waschen und mit Mandeln genießen"] },
      { name: "Banane", protein: 1, carbs: 25, fat: 0, prepTime: 1, ingredients: [{ name: "Banane", amount: "1 Stück", price: 0.30 }], instructions: ["Banane schälen und genießen"] },
      { name: "Karotten mit Hummus", protein: 5, carbs: 18, fat: 7, prepTime: 5, ingredients: [{ name: "Karotten", amount: "100g", price: 0.30 }, { name: "Hummus", amount: "50g", price: 0.80 }], instructions: ["Karotten schneiden", "Mit Hummus dippen"] },
      { name: "Nüsse-Mix", protein: 6, carbs: 8, fat: 16, prepTime: 0, ingredients: [{ name: "Gemischte Nüsse", amount: "30g", price: 1.00 }], instructions: ["Genießen"] },
      { name: "Proteinriegel", protein: 20, carbs: 18, fat: 8, prepTime: 0, ingredients: [{ name: "Proteinriegel", amount: "1 Stück", price: 2.00 }], instructions: ["Auspacken und genießen"] },
      { name: "Hüttenkäse", protein: 14, carbs: 4, fat: 5, prepTime: 2, ingredients: [{ name: "Hüttenkäse", amount: "150g", price: 1.00 }], instructions: ["In Schüssel geben"] },
    ],
    lunch: [
      { name: "Hähnchen-Salat", protein: 35, carbs: 20, fat: 25, prepTime: 20, ingredients: [{ name: "Hähnchenbrust", amount: "150g", price: 2.50 }, { name: "Salat-Mix", amount: "100g", price: 1.00 }, { name: "Olivenöl", amount: "2 EL", price: 0.30 }], instructions: ["Hähnchen braten", "Mit Salat servieren"] },
      { name: "Thunfisch-Wrap", protein: 30, carbs: 40, fat: 15, prepTime: 10, ingredients: [{ name: "Thunfisch", amount: "100g", price: 1.80 }, { name: "Tortilla", amount: "1 Stück", price: 0.50 }, { name: "Salat", amount: "50g", price: 0.50 }], instructions: ["Thunfisch abtropfen", "In Tortilla wickeln mit Salat"] },
      { name: "Buddha Bowl", protein: 22, carbs: 55, fat: 20, prepTime: 25, ingredients: [{ name: "Quinoa", amount: "80g", price: 0.80 }, { name: "Kichererbsen", amount: "100g", price: 0.60 }, { name: "Avocado", amount: "0.5 Stück", price: 1.00 }], instructions: ["Quinoa kochen", "Alles in einer Bowl anrichten"] },
      { name: "Gemüsesuppe mit Brot", protein: 12, carbs: 50, fat: 14, prepTime: 30, ingredients: [{ name: "Gemüse-Mix", amount: "300g", price: 2.00 }, { name: "Brühe", amount: "500ml", price: 0.50 }, { name: "Baguette", amount: "50g", price: 0.40 }], instructions: ["Gemüse in Brühe kochen", "Mit Brot servieren"] },
      { name: "Linsensalat", protein: 18, carbs: 45, fat: 12, prepTime: 15, ingredients: [{ name: "Linsen", amount: "150g", price: 0.60 }, { name: "Tomaten", amount: "100g", price: 0.80 }, { name: "Feta", amount: "50g", price: 1.20 }], instructions: ["Linsen kochen", "Mit Tomaten und Feta mischen"] },
      { name: "Putenbrust-Sandwich", protein: 28, carbs: 35, fat: 10, prepTime: 10, ingredients: [{ name: "Putenbrust", amount: "100g", price: 2.00 }, { name: "Vollkornbrot", amount: "2 Scheiben", price: 0.40 }, { name: "Salat", amount: "30g", price: 0.30 }], instructions: ["Brot belegen", "Mit Salat garnieren"] },
      { name: "Griechischer Salat", protein: 12, carbs: 20, fat: 22, prepTime: 15, ingredients: [{ name: "Gurke", amount: "100g", price: 0.50 }, { name: "Tomaten", amount: "150g", price: 1.00 }, { name: "Feta", amount: "80g", price: 1.50 }], instructions: ["Gemüse schneiden", "Mit Feta und Olivenöl anrichten"] },
    ],
    dinner: [
      { name: "Lachs mit Gemüse", protein: 38, carbs: 25, fat: 28, prepTime: 30, ingredients: [{ name: "Lachsfilet", amount: "150g", price: 4.00 }, { name: "Brokkoli", amount: "150g", price: 1.00 }, { name: "Reis", amount: "80g", price: 0.20 }], instructions: ["Lachs im Ofen backen", "Gemüse dünsten", "Mit Reis servieren"] },
      { name: "Pasta mit Pesto", protein: 18, carbs: 65, fat: 22, prepTime: 20, ingredients: [{ name: "Pasta", amount: "100g", price: 0.40 }, { name: "Pesto", amount: "2 EL", price: 1.00 }, { name: "Parmesan", amount: "20g", price: 0.80 }], instructions: ["Pasta kochen", "Mit Pesto und Parmesan mischen"] },
      { name: "Rindfleisch-Pfanne", protein: 40, carbs: 30, fat: 30, prepTime: 25, ingredients: [{ name: "Rindfleisch", amount: "150g", price: 4.50 }, { name: "Paprika", amount: "100g", price: 0.80 }, { name: "Zwiebeln", amount: "50g", price: 0.20 }], instructions: ["Rindfleisch anbraten", "Gemüse hinzufügen und braten"] },
      { name: "Hähnchen-Curry", protein: 35, carbs: 40, fat: 18, prepTime: 30, ingredients: [{ name: "Hähnchenbrust", amount: "150g", price: 2.50 }, { name: "Kokosmilch", amount: "150ml", price: 1.00 }, { name: "Reis", amount: "80g", price: 0.20 }], instructions: ["Hähnchen anbraten", "Mit Kokosmilch und Curry köcheln", "Mit Reis servieren"] },
      { name: "Gemüse-Stir-Fry mit Tofu", protein: 22, carbs: 35, fat: 16, prepTime: 20, ingredients: [{ name: "Tofu", amount: "150g", price: 1.80 }, { name: "Gemüse-Mix", amount: "200g", price: 1.50 }, { name: "Sojasauce", amount: "2 EL", price: 0.30 }], instructions: ["Tofu anbraten", "Gemüse hinzufügen", "Mit Sojasauce würzen"] },
      { name: "Omelette mit Gemüse", protein: 25, carbs: 15, fat: 20, prepTime: 15, ingredients: [{ name: "Eier", amount: "4 Stück", price: 1.20 }, { name: "Paprika", amount: "50g", price: 0.40 }, { name: "Zwiebeln", amount: "30g", price: 0.10 }], instructions: ["Gemüse anbraten", "Eier dazugeben und stocken lassen"] },
      { name: "Gegrilltes Hähnchen mit Kartoffeln", protein: 38, carbs: 45, fat: 15, prepTime: 35, ingredients: [{ name: "Hähnchenbrust", amount: "150g", price: 2.50 }, { name: "Kartoffeln", amount: "200g", price: 0.60 }, { name: "Kräuter", amount: "1 EL", price: 0.20 }], instructions: ["Kartoffeln kochen", "Hähnchen braten", "Zusammen servieren"] },
    ],
  };
  
  return days.map((day, index) => ({
    day,
    meals: [
      { type: "Frühstück", ...mealOptions.breakfast[index % mealOptions.breakfast.length], calories: breakfastCal },
      { type: "Snack", ...mealOptions.snack[index % mealOptions.snack.length], calories: snack1Cal },
      { type: "Mittagessen", ...mealOptions.lunch[index % mealOptions.lunch.length], calories: lunchCal },
      { type: "Snack", ...mealOptions.snack[(index + 3) % mealOptions.snack.length], calories: snack2Cal },
      { type: "Abendessen", ...mealOptions.dinner[index % mealOptions.dinner.length], calories: dinnerCal },
    ],
  }));
};
