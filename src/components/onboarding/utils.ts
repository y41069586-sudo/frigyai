import { UserData } from "./types";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import { saveReminderConfigFromOnboarding, syncRemindersFromStorage } from "@/lib/notifications";
import { clearPendingReferralCode, REFERRAL_SKIP_PAYWALL_KEY } from "@/lib/referralCode";

/** Minimum daily calories when losing weight (aligned with MacroTracker). */
export function getMinCaloriesForAge(age: number): number {
  return age < 25 ? 1500 : age < 40 ? 1400 : 1300;
}

/** Nach Abmelden: Onboarding von vorne (lokaler Zustand). */
export function clearOnboardingForLogout() {
  localStorage.removeItem("onboardingComplete");
  localStorage.removeItem("onboardingUserData");
  localStorage.removeItem("userName");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("reminderConfig");
  localStorage.removeItem("weeklyMealPlan");
  localStorage.removeItem("weeklyShoppingList");
  localStorage.removeItem("frigy_weekly_plan_ai_generated");
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

  const activityMultipliers: Record<string, number> = {
    low: 1.2,
    medium: 1.55,
    high: 1.9,
  };

  const tdee = bmr * (activityMultipliers[activityLevel || "medium"] || 1.55);
  const dailyCalorieChange = weeklyGoal * 1100;

  let dailyCalories: number;
  if (goalMode === "lose") {
    dailyCalories = tdee - dailyCalorieChange;
  } else {
    dailyCalories = tdee + dailyCalorieChange;
  }

  dailyCalories = Math.max(dailyCalories, getMinCaloriesForAge(age));
  dailyCalories = Math.round(dailyCalories);

  const dailyProtein = Math.round(weight * 2);
  const dailyFat = Math.round(weight * 0.9);
  const proteinCalories = dailyProtein * 4;
  const fatCalories = dailyFat * 9;
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const dailyCarbs = Math.max(50, Math.round(remainingCalories / 4));

  return { dailyCalories, dailyProtein, dailyCarbs, dailyFat };
};

export const calculateWeeksToGoal = (userData: UserData) => {
  const weightDiff = Math.abs(userData.targetWeight - userData.weight);

  if (!userData.weeklyGoal || userData.weeklyGoal <= 0) {
    console.warn("calculateWeeksToGoal: Invalid weekly goal value, returning Infinity");
    return Infinity;
  }

  return Math.ceil(weightDiff / userData.weeklyGoal);
};

export type SaveOnboardingOptions = {
  /** Default true — set false until paywall / post-signup flow is done */
  markOnboardingComplete?: boolean;
};

export const saveOnboardingData = (
  userData: UserData,
  options: SaveOnboardingOptions = {},
) => {
  const markComplete = options.markOnboardingComplete ?? true;

  localStorage.setItem("onboardingUserData", JSON.stringify(userData));
  if (markComplete) {
    localStorage.setItem("onboardingComplete", "true");
  }

  if (userData.name) {
    localStorage.setItem("userName", userData.name);
  }

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
  localStorage.setItem("userProfile", JSON.stringify(trackerSettings));
  notifyFrigyStorageUpdated();

  if (
    userData.notificationPrefs.meals ||
    userData.notificationPrefs.water ||
    userData.notificationPrefs.weight
  ) {
    saveReminderConfigFromOnboarding(userData.notificationPrefs);
    void syncRemindersFromStorage();
  }
};

/** Nach Registrierung: Daten speichern, Onboarding endet nach Paywall */
export const saveOnboardingAfterSignup = (userData: UserData) => {
  saveOnboardingData(userData, { markOnboardingComplete: false });
};
