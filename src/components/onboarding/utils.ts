import { UserData } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import { saveReminderConfigFromOnboarding, syncRemindersFromStorage } from "@/lib/notifications";
import { clearPendingReferralCode } from "@/lib/referralCode";
import { invalidateTrackerSettingsCache } from "@/hooks/useTrackerSettings";

/** Minimum age to use Frigy (Google Play / App Store: 13+). */
export const MIN_ONBOARDING_AGE = 13;

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
  if (goalMode === "maintain") {
    dailyCalories = tdee;
  } else if (goalMode === "lose") {
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
  if (userData.goalMode === "maintain") {
    return 0;
  }

  const weightDiff = Math.abs(userData.targetWeight - userData.weight);

  if (!userData.weeklyGoal || userData.weeklyGoal <= 0) {
    console.warn("calculateWeeksToGoal: Invalid weekly goal value, returning Infinity");
    return Infinity;
  }

  return Math.ceil(weightDiff / userData.weeklyGoal);
};

async function accountHasSavedTrackerMacros(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_tracker_settings")
    .select("daily_calories")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.daily_calories ?? 0) > 0;
}

async function syncTrackerProfileToCloud(settings: Record<string, unknown>) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    if (await accountHasSavedTrackerMacros(session.user.id)) {
      return;
    }

    await supabase.from("user_tracker_settings").upsert(
      {
        user_id: session.user.id,
        age: (settings.age as number) || null,
        weight: (settings.weight as number) || null,
        target_weight: (settings.targetWeight as number) || null,
        goal_mode: (settings.goalMode as string) || "lose",
        weekly_goal: (settings.weeklyGoal as number) || 0.5,
        daily_calories: (settings.dailyCalories as number) || null,
        daily_protein: (settings.dailyProtein as number) || null,
        daily_carbs: (settings.dailyCarbs as number) || null,
        daily_fat: (settings.dailyFat as number) || null,
        dietary_preferences: (settings.dietaryPreferences as string[]) ?? [],
        health_goals: (settings.healthGoals as string[]) ?? [],
        allergies: (settings.allergies as string[]) ?? [],
        allergies_other: (settings.allergiesOther as string) ?? "",
      },
      { onConflict: "user_id" },
    );
  } catch (e) {
    console.warn("[onboarding] cloud profile sync failed:", e);
  }
}

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

  const writeLocalTrackerProfile = () => {
    localStorage.setItem("userProfile", JSON.stringify(trackerSettings));
    invalidateTrackerSettingsCache();
    notifyFrigyStorageUpdated();
  };

  writeLocalTrackerProfile();

  void (async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user && (await accountHasSavedTrackerMacros(session.user.id))) {
      invalidateTrackerSettingsCache();
      return;
    }
    await syncTrackerProfileToCloud(trackerSettings);
  })();

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

/** After OAuth return to /auth?from=onboarding — sync profile from in-progress onboarding. */
export function persistOnboardingSignupFromStorage(): void {
  const raw = localStorage.getItem("onboardingUserData");
  if (!raw) return;
  try {
    const userData = JSON.parse(raw) as UserData;
    saveOnboardingAfterSignup(userData);
  } catch {
    console.warn("[onboarding] could not restore onboardingUserData after OAuth");
  }
}
