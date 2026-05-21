import { UserData } from "./types";
import {
  FIRST_WEEKLY_PLAN_DONE_KEY,
  notifyFrigyStorageUpdated,
} from "@/lib/frigyStorageSync";
import { saveReminderConfigFromOnboarding, syncRemindersFromStorage } from "@/lib/notifications";
import { isMealSafeForUser } from "@/lib/mealAllergySafety";
import { clearPendingReferralCode, REFERRAL_SKIP_PAYWALL_KEY } from "@/lib/referralCode";

/** Nach Abmelden: Onboarding von vorne (lokaler Zustand). */
export function clearOnboardingForLogout() {
  localStorage.removeItem("onboardingComplete");
  localStorage.removeItem("onboardingUserData");
  localStorage.removeItem("userName");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("reminderConfig");
  localStorage.removeItem("weeklyMealPlan");
  localStorage.removeItem(FIRST_WEEKLY_PLAN_DONE_KEY);
  localStorage.removeItem("mealPlanGenerationCount");
  localStorage.removeItem("scanFeedback");
  clearPendingReferralCode();
  localStorage.removeItem(REFERRAL_SKIP_PAYWALL_KEY);
}

// Macro calculation using Mifflin-St Jeor BMR formula
export const calculateMacros = (userData: UserData) => {
  const { weight, height, age, gender, activityLevel, goalMode, weeklyGoal } = userData;
  
  const genderConstant =
    gender === "female" ? -161 : gender === "non-binary" ? -78 : 5;
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

  // Guard against division by zero
  if (!userData.weeklyGoal || userData.weeklyGoal <= 0) {
    console.warn('calculateWeeksToGoal: Invalid weekly goal value, returning Infinity');
    return Infinity;
  }

  return Math.ceil(weightDiff / userData.weeklyGoal);
};

export type SaveOnboardingOptions = {
  /** Default true — set false until paywall / post-signup flow is done */
  markOnboardingComplete?: boolean;
  /** Default true — set false to skip demo plan until user generates one in the app */
  writeInitialMealPlan?: boolean;
};

// Save onboarding data to localStorage and optionally a demo meal plan
export const saveOnboardingData = (
  userData: UserData,
  options: SaveOnboardingOptions = {},
) => {
  const markComplete = options.markOnboardingComplete ?? true;
  const writeInitialMealPlan = options.writeInitialMealPlan ?? true;

  localStorage.setItem('onboardingUserData', JSON.stringify(userData));
  if (markComplete) {
    localStorage.setItem('onboardingComplete', 'true');
  }
  
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
    healthGoals: userData.healthGoals,
    allergies: userData.allergies,
    allergiesOther: userData.allergiesOther,
    cookingExperience: userData.cookingExperience,
    cookingTime: userData.cookingTime,
    notificationPrefs: userData.notificationPrefs,
  };
  localStorage.setItem('userProfile', JSON.stringify(trackerSettings));
  
  // Save reminder configuration based on onboarding notification preferences
  if (
    userData.notificationPrefs.meals ||
    userData.notificationPrefs.water ||
    userData.notificationPrefs.weight
  ) {
    saveReminderConfigFromOnboarding(userData.notificationPrefs);
    void syncRemindersFromStorage();
  }

  const dietaryOnly = (userData.dietaryPreferences || []).filter((d) => d && d !== "none");
  const allergyList = (userData.allergies || []).filter((a) => a && a !== "none");

  if (writeInitialMealPlan) {
    const initialMealPlan = generateInitialMealPlan(dailyCalories, allergyList, dietaryOnly, {
      protein: dailyProtein,
      carbs: dailyCarbs,
      fat: dailyFat,
    });
    localStorage.setItem('weeklyMealPlan', JSON.stringify(initialMealPlan));
    notifyFrigyStorageUpdated();
    localStorage.setItem('mealPlanGenerationCount', '0');
  }
};

/** Nach Registrierung: Daten speichern, Onboarding endet nach Paywall */
export const saveOnboardingAfterSignup = (userData: UserData) => {
  saveOnboardingData(userData, {
    markOnboardingComplete: false,
    writeInitialMealPlan: false,
  });
};

// Generate an initial personalized meal plan with simple, everyday German foods
const generateInitialMealPlan = (
  targetCalories: number,
  allergies: string[] = [],
  dietaryPreferences: string[] = [],
  macroTargets?: { protein: number; carbs: number; fat: number },
) => {
  const breakfastCal = Math.round(targetCalories * 0.25);
  const snack1Cal = Math.round(targetCalories * 0.1);
  const lunchCal = Math.round(targetCalories * 0.3);
  const snack2Cal = Math.round(targetCalories * 0.1);
  const dinnerCal = Math.round(targetCalories * 0.25);
  
  const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  
  const mealOptions = {
    breakfast: [
      { name: "Rührei mit Speck", protein: 22, carbs: 8, fat: 28, prepTime: 10, ingredients: [{ name: "Eier", amount: "3 Stück", price: 0.90 }, { name: "Speck", amount: "50g", price: 1.20 }, { name: "Butter", amount: "10g", price: 0.10 }], instructions: ["Speck in Pfanne braten", "Eier verquirlen und dazugeben", "Stocken lassen und servieren"] },
      { name: "Müsli mit Milch", protein: 12, carbs: 55, fat: 8, prepTime: 5, ingredients: [{ name: "Müsli", amount: "60g", price: 0.50 }, { name: "Milch", amount: "200ml", price: 0.40 }, { name: "Banane", amount: "1 Stück", price: 0.30 }], instructions: ["Müsli in Schüssel geben", "Mit Milch übergießen", "Banane in Scheiben dazu"] },
      { name: "Brötchen mit Käse", protein: 18, carbs: 40, fat: 16, prepTime: 5, ingredients: [{ name: "Brötchen", amount: "2 Stück", price: 0.60 }, { name: "Käse", amount: "60g", price: 1.00 }, { name: "Butter", amount: "15g", price: 0.15 }], instructions: ["Brötchen aufschneiden", "Mit Butter bestreichen", "Käse drauflegen"] },
      { name: "Haferbrei mit Honig", protein: 10, carbs: 50, fat: 8, prepTime: 10, ingredients: [{ name: "Haferflocken", amount: "60g", price: 0.25 }, { name: "Milch", amount: "250ml", price: 0.50 }, { name: "Honig", amount: "1 EL", price: 0.30 }], instructions: ["Haferflocken mit Milch aufkochen", "5 Minuten köcheln", "Mit Honig süßen"] },
      { name: "Joghurt mit Früchten", protein: 15, carbs: 35, fat: 8, prepTime: 5, ingredients: [{ name: "Naturjoghurt", amount: "200g", price: 0.80 }, { name: "Beeren", amount: "100g", price: 1.50 }, { name: "Honig", amount: "1 TL", price: 0.20 }], instructions: ["Joghurt in Schüssel geben", "Früchte darauf verteilen", "Mit Honig beträufeln"] },
      { name: "Vollkornbrot mit Ei", protein: 16, carbs: 30, fat: 14, prepTime: 10, ingredients: [{ name: "Vollkornbrot", amount: "2 Scheiben", price: 0.40 }, { name: "Eier", amount: "2 Stück", price: 0.60 }, { name: "Butter", amount: "10g", price: 0.10 }], instructions: ["Eier als Spiegelei braten", "Brot mit Butter bestreichen", "Eier drauflegen"] },
      { name: "Quark mit Banane", protein: 20, carbs: 30, fat: 5, prepTime: 5, ingredients: [{ name: "Magerquark", amount: "200g", price: 0.90 }, { name: "Banane", amount: "1 Stück", price: 0.30 }, { name: "Honig", amount: "1 TL", price: 0.20 }], instructions: ["Quark in Schüssel geben", "Banane zerdrücken und unterrühren", "Mit Honig süßen"] },
    ],
    snack: [
      { name: "Apfel", protein: 0, carbs: 20, fat: 0, prepTime: 1, ingredients: [{ name: "Apfel", amount: "1 Stück", price: 0.50 }], instructions: ["Apfel waschen und genießen"] },
      { name: "Joghurt", protein: 10, carbs: 8, fat: 5, prepTime: 2, ingredients: [{ name: "Naturjoghurt", amount: "150g", price: 0.60 }], instructions: ["Joghurt löffeln"] },
      { name: "Banane", protein: 1, carbs: 25, fat: 0, prepTime: 1, ingredients: [{ name: "Banane", amount: "1 Stück", price: 0.30 }], instructions: ["Banane schälen und essen"] },
      { name: "Käsewürfel", protein: 12, carbs: 1, fat: 14, prepTime: 2, ingredients: [{ name: "Käse", amount: "50g", price: 0.80 }], instructions: ["Käse in Würfel schneiden"] },
      { name: "Nüsse", protein: 6, carbs: 5, fat: 18, prepTime: 0, ingredients: [{ name: "Gemischte Nüsse", amount: "30g", price: 0.80 }], instructions: ["Nüsse snacken"] },
      { name: "Müsliriegel", protein: 4, carbs: 25, fat: 8, prepTime: 0, ingredients: [{ name: "Müsliriegel", amount: "1 Stück", price: 0.70 }], instructions: ["Auspacken und essen"] },
      { name: "Quark", protein: 14, carbs: 4, fat: 0, prepTime: 2, ingredients: [{ name: "Magerquark", amount: "150g", price: 0.70 }], instructions: ["Quark löffeln"] },
    ],
    lunch: [
      { name: "Spaghetti Bolognese", protein: 30, carbs: 60, fat: 20, prepTime: 25, ingredients: [{ name: "Spaghetti", amount: "100g", price: 0.35 }, { name: "Hackfleisch", amount: "150g", price: 2.50 }, { name: "Tomatensauce", amount: "150g", price: 0.80 }], instructions: ["Pasta kochen", "Hackfleisch anbraten", "Mit Tomatensauce köcheln", "Zusammen servieren"] },
      { name: "Schnitzel mit Pommes", protein: 35, carbs: 50, fat: 25, prepTime: 30, ingredients: [{ name: "Schweineschnitzel", amount: "150g", price: 2.80 }, { name: "Pommes", amount: "150g", price: 1.00 }, { name: "Paniermehl", amount: "30g", price: 0.20 }], instructions: ["Schnitzel panieren", "In Öl goldbraun braten", "Mit Pommes servieren"] },
      { name: "Hähnchen mit Reis", protein: 38, carbs: 45, fat: 12, prepTime: 25, ingredients: [{ name: "Hähnchenbrust", amount: "150g", price: 2.50 }, { name: "Reis", amount: "80g", price: 0.20 }, { name: "Gemüse", amount: "100g", price: 0.80 }], instructions: ["Reis kochen", "Hähnchen braten", "Mit Gemüse servieren"] },
      { name: "Nudeln mit Sahnesauce", protein: 18, carbs: 65, fat: 25, prepTime: 20, ingredients: [{ name: "Nudeln", amount: "100g", price: 0.40 }, { name: "Sahne", amount: "100ml", price: 0.60 }, { name: "Schinken", amount: "50g", price: 1.20 }], instructions: ["Nudeln kochen", "Sahne mit Schinken erwärmen", "Alles vermischen"] },
      { name: "Frikadellen mit Kartoffeln", protein: 32, carbs: 40, fat: 22, prepTime: 30, ingredients: [{ name: "Hackfleisch", amount: "150g", price: 2.50 }, { name: "Kartoffeln", amount: "200g", price: 0.50 }, { name: "Zwiebel", amount: "1 Stück", price: 0.15 }], instructions: ["Kartoffeln kochen", "Frikadellen formen und braten", "Zusammen servieren"] },
      { name: "Currywurst mit Brötchen", protein: 22, carbs: 45, fat: 28, prepTime: 15, ingredients: [{ name: "Bratwurst", amount: "150g", price: 1.80 }, { name: "Currysoße", amount: "80g", price: 0.60 }, { name: "Brötchen", amount: "1 Stück", price: 0.30 }], instructions: ["Wurst braten", "Mit Currysoße übergießen", "Mit Brötchen servieren"] },
      { name: "Tomatensuppe mit Brot", protein: 8, carbs: 40, fat: 12, prepTime: 20, ingredients: [{ name: "Tomaten passiert", amount: "400g", price: 1.00 }, { name: "Sahne", amount: "50ml", price: 0.30 }, { name: "Brot", amount: "2 Scheiben", price: 0.30 }], instructions: ["Tomaten erhitzen", "Sahne einrühren", "Mit Brot servieren"] },
    ],
    dinner: [
      { name: "Bratkartoffeln mit Spiegelei", protein: 18, carbs: 45, fat: 25, prepTime: 25, ingredients: [{ name: "Kartoffeln", amount: "300g", price: 0.70 }, { name: "Eier", amount: "2 Stück", price: 0.60 }, { name: "Speck", amount: "50g", price: 1.00 }], instructions: ["Kartoffeln kochen und braten", "Speck anbraten", "Spiegeleier braten", "Zusammen servieren"] },
      { name: "Lachs mit Kartoffeln", protein: 35, carbs: 40, fat: 20, prepTime: 30, ingredients: [{ name: "Lachsfilet", amount: "150g", price: 4.00 }, { name: "Kartoffeln", amount: "200g", price: 0.50 }, { name: "Dill", amount: "frisch", price: 0.30 }], instructions: ["Kartoffeln kochen", "Lachs in Pfanne braten", "Mit Dill garnieren"] },
      { name: "Hähnchen mit Gemüse", protein: 38, carbs: 25, fat: 15, prepTime: 30, ingredients: [{ name: "Hähnchenbrust", amount: "150g", price: 2.50 }, { name: "Brokkoli", amount: "150g", price: 1.00 }, { name: "Möhren", amount: "100g", price: 0.40 }], instructions: ["Gemüse dünsten", "Hähnchen braten", "Zusammen anrichten"] },
      { name: "Würstchen mit Sauerkraut", protein: 18, carbs: 15, fat: 30, prepTime: 15, ingredients: [{ name: "Würstchen", amount: "2 Stück", price: 2.00 }, { name: "Sauerkraut", amount: "200g", price: 0.80 }, { name: "Senf", amount: "1 EL", price: 0.10 }], instructions: ["Würstchen erwärmen", "Sauerkraut erhitzen", "Mit Senf servieren"] },
      { name: "Nudelauflauf", protein: 25, carbs: 55, fat: 22, prepTime: 35, ingredients: [{ name: "Nudeln", amount: "100g", price: 0.40 }, { name: "Hackfleisch", amount: "100g", price: 1.70 }, { name: "Käse", amount: "50g", price: 0.80 }], instructions: ["Nudeln kochen", "Hackfleisch anbraten", "Alles mit Käse überbacken"] },
      { name: "Omelett mit Schinken", protein: 28, carbs: 5, fat: 22, prepTime: 10, ingredients: [{ name: "Eier", amount: "4 Stück", price: 1.20 }, { name: "Schinken", amount: "60g", price: 1.00 }, { name: "Käse", amount: "40g", price: 0.65 }], instructions: ["Eier verquirlen", "In Pfanne geben", "Schinken und Käse drauf, zusammenklappen"] },
      { name: "Kartoffelbrei mit Bratwurst", protein: 22, carbs: 50, fat: 28, prepTime: 25, ingredients: [{ name: "Kartoffeln", amount: "300g", price: 0.70 }, { name: "Bratwurst", amount: "2 Stück", price: 2.20 }, { name: "Butter", amount: "30g", price: 0.30 }], instructions: ["Kartoffeln kochen und stampfen", "Butter unterrühren", "Bratwurst braten und dazuservieren"] },
    ],
  };

  type PoolMeal = (typeof mealOptions.breakfast)[number];

  const pickMeal = (pool: PoolMeal[], index: number): PoolMeal => {
    const safe = pool.filter((m) => isMealSafeForUser(m, allergies, dietaryPreferences));
    const relaxed = pool.filter((m) => isMealSafeForUser(m, [], dietaryPreferences));
    const use = safe.length ? safe : relaxed.length ? relaxed : pool;
    return use[index % use.length];
  };
  
  const plan = days.map((day, index) => ({
    day,
    meals: [
      { type: "Frühstück", ...pickMeal(mealOptions.breakfast, index), calories: breakfastCal },
      { type: "Snack", ...pickMeal(mealOptions.snack, index), calories: snack1Cal },
      { type: "Mittagessen", ...pickMeal(mealOptions.lunch, index), calories: lunchCal },
      { type: "Snack", ...pickMeal(mealOptions.snack, index + 3), calories: snack2Cal },
      { type: "Abendessen", ...pickMeal(mealOptions.dinner, index), calories: dinnerCal },
    ],
  }));

  if (!macroTargets) return plan;

  return plan.map((day) => {
    const sums = day.meals.reduce(
      (acc, meal) => ({
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );

    const proteinFactor = macroTargets.protein / Math.max(1, sums.protein);
    const carbsFactor = macroTargets.carbs / Math.max(1, sums.carbs);
    const fatFactor = macroTargets.fat / Math.max(1, sums.fat);

    return {
      ...day,
      meals: day.meals.map((meal) => {
        const protein = Math.max(0, Math.round((meal.protein || 0) * proteinFactor));
        const carbs = Math.max(0, Math.round((meal.carbs || 0) * carbsFactor));
        const fat = Math.max(0, Math.round((meal.fat || 0) * fatFactor));
        return {
          ...meal,
          protein,
          carbs,
          fat,
          calories: Math.max(50, Math.round(protein * 4 + carbs * 4 + fat * 9)),
        };
      }),
    };
  });
};
