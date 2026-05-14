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
  | "birthdate"
  | "weight"
  | "height"
  | "activity"
  | "apple-health-connect"
  | "main-goal"
  | "goal-preview"
  | "goal-mode"
  | "target-weight"
  | "speed-select"
  | "health-goals"
  | "dietary-preferences"
  | "allergies"
  | "weekly-plan-preview"
  | "scan-fridge"
  | "shopping-list"
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
  heightUnit: 'metric' | 'imperial';
  heightFeet: number;
  heightInches: number;
  weight: number;
  weightDecimal: number;
  weightUnit: 'metric' | 'imperial';
  age: number;
  gender: 'male' | 'female' | 'non-binary' | null;
  birthdate: { day: number; month: number; year: number } | null;
  goalMode: 'lose' | 'maintain' | 'gain';
  targetWeight: number;
  targetWeightDecimal: number;
  weeklyGoal: number;
  activityLevel: string | null;
  macroFocus: string | null;
  cameraPermission: boolean;
  healthSync: string | null;
  dietaryPreferences: string[];
  healthGoals: string[];
  allergies: string[];
  allergiesOther: string;
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
  heightUnit: 'metric',
  heightFeet: 5,
  heightInches: 7,
  weight: 70,
  weightDecimal: 0,
  weightUnit: 'metric',
  age: 25,
  gender: null,
  birthdate: { day: 15, month: 6, year: new Date().getFullYear() - 25 },
  goalMode: 'lose',
  targetWeight: 65,
  targetWeightDecimal: 0,
  weeklyGoal: 0.5,
  activityLevel: null,
  macroFocus: "balanced",
  cameraPermission: false,
  healthSync: null,
  dietaryPreferences: [],
  healthGoals: [],
  allergies: [],
  allergiesOther: '',
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
export const onboardingSteps: OnboardingStep[] = [
  "splash",
  "gender",
  "birthdate",
  "weight",
  "height",
  "activity",
  "apple-health-connect",
  "main-goal",
  "target-weight",
  "goal-preview",
  "speed-select",
  "health-goals",
  "dietary-preferences",
  "allergies",
  "weekly-plan-preview",
  "scan-fridge",
  "shopping-list",
];
