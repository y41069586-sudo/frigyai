import { Language } from "@/contexts/LanguageContext";

export type OnboardingStep =
  | "splash"
  | "intro"
  | "language-select"
  | "name-input"
  | "welcome"
  | "goal"
  | "motivation"
  | "success-stats"
  | "tutorial-transition"  // Smooth transition before tutorial
  | "fridge-intro"
  | "scan-feedback"
  | "how-it-works"
  | "permissions"
  | "notification-prefs"
  | "weekly-plan"
  | "comparison"
  | "transformation"
  | "tutorial"  // Interactive tutorial (slides in InteractiveTutorial.tsx)
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
  // App Mode Choice (nach Macro-Preview) - kept for backwards compat
  | "app-mode-choice"
  | "spontan-mode-1"
  | "spontan-mode-2"
  | "structured-mode-1"
  | "structured-mode-2"
  | "structured-mode-3"
  | "save-progress"
  | "premium-hint"
  | "community"
  | "celebration"
  | "done";

export interface UserData {
  name: string;
  goal: string | null;
  motivation: string | null;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | null;
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
  name: '',
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

// Steps array for navigation - logically structured flow
export const onboardingSteps: OnboardingStep[] = ["splash", "gender"];
