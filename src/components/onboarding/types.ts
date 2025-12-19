import { Language } from "@/contexts/LanguageContext";

// Simple 4-step onboarding
export type OnboardingStep = "intro" | "message" | "action" | "feedback" | "done";

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

// Simple 4-step flow
export const onboardingSteps: OnboardingStep[] = [
  "intro",
  "message", 
  "action",
  "feedback",
  "done"
];
