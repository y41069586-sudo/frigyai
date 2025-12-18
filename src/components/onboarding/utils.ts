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

// Save onboarding data to localStorage
export const saveOnboardingData = (userData: UserData) => {
  localStorage.setItem('onboardingUserData', JSON.stringify(userData));
  localStorage.setItem('onboardingComplete', 'true');
  
  const trackerSettings = {
    age: userData.age,
    height: userData.height,
    weight: userData.weight,
    gender: userData.gender,
    targetWeight: userData.targetWeight,
    goalMode: userData.goalMode,
    weeklyGoal: userData.weeklyGoal,
    dailyCalories: userData.dailyCalories,
    dailyProtein: userData.dailyProtein,
    dailyCarbs: userData.dailyCarbs,
    dailyFat: userData.dailyFat,
    dietaryPreferences: userData.dietaryPreferences,
    allergies: userData.allergies,
    cookingExperience: userData.cookingExperience,
    cookingTime: userData.cookingTime,
    notificationPrefs: userData.notificationPrefs,
  };
  localStorage.setItem('userProfile', JSON.stringify(trackerSettings));
};
