import { Language } from "@/contexts/LanguageContext";

export type OnboardingStep = 
  | "language-select"
  | "welcome"
  | "goal"
  | "motivation"
  | "social-proof"
  | "success-stats"
  | "fridge-intro"
  | "permissions"
  | "notification-prefs"
  | "weekly-plan"
  | "comparison"
  | "transformation"
  | "tracker-intro"
  | "body-basics"
  | "gender"
  | "goal-mode"
  | "target-weight"
  | "speed-select"
  | "dietary-preferences"
  | "allergies"
  | "cooking-time"
  | "cooking-experience"
  | "planning-setup"
  | "analyzing"
  | "macro-preview"
  | "premium-hint"
  | "community"
  | "done";

export interface UserData {
  goal: string | null;
  motivation: string | null;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | null;
  goalMode: 'lose' | 'gain';
  targetWeight: number;
  weeklyGoal: number;
  activityLevel: string | null;
  macroFocus: string | null;
  cameraPermission: boolean;
  healthSync: string | null;
  dietaryPreferences: string[];
  allergies: string[];
  cookingExperience: 'beginner' | 'intermediate' | 'advanced' | null;
  cookingTime: 'quick' | 'medium' | 'long' | null;
  notificationPrefs: {
    meals: boolean;
    water: boolean;
    weight: boolean;
  };
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

export interface StepProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  goNext: () => void;
  goBack: () => void;
}

export const defaultUserData: UserData = {
  goal: null,
  motivation: null,
  height: 170,
  weight: 70,
  age: 25,
  gender: null,
  goalMode: 'lose',
  targetWeight: 65,
  weeklyGoal: 0.5,
  activityLevel: null,
  macroFocus: "balanced",
  cameraPermission: false,
  healthSync: null,
  dietaryPreferences: [],
  allergies: [],
  cookingExperience: null,
  cookingTime: null,
  notificationPrefs: {
    meals: true,
    water: true,
    weight: false,
  },
  dailyCalories: 0,
  dailyProtein: 0,
  dailyCarbs: 0,
  dailyFat: 0,
};

// Steps array for navigation
export const onboardingSteps: OnboardingStep[] = [
  "language-select",
  "welcome",
  "goal",
  "motivation",
  "social-proof",
  "success-stats",
  "tracker-intro",
  "body-basics",
  "gender",
  "goal-mode",
  "target-weight",
  "speed-select",
  "dietary-preferences",
  "allergies",
  "cooking-time",
  "cooking-experience",
  "planning-setup",
  "analyzing",
  "macro-preview",
  "fridge-intro",
  "permissions",
  "notification-prefs",
  "weekly-plan",
  "comparison",
  "transformation",
  "premium-hint",
  "community",
  "done"
];
