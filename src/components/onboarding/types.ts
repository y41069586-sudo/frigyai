import { Language } from "@/contexts/LanguageContext";

export type OnboardingStep = 
  | "intro"
  | "language-select"
  | "name-input"
  | "welcome"
  | "goal"
  | "motivation"
  | "social-proof"
  | "success-stats"
  | "fridge-intro"
  | "scan-feedback"
  | "how-it-works"
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
  // App Mode Choice (nach Macro-Preview)
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
export const onboardingSteps: OnboardingStep[] = [
  // Phase 1: Language & Name
  "language-select",
  "name-input",
  "welcome",
  "goal",
  "motivation",
  
  // Phase 2: Social Proof & Trust
  "social-proof",
  "success-stats",
  
  // Phase 3: Fridge Scan Demo (before personalization)
  "fridge-intro",
  "scan-feedback",
  "how-it-works",
  "tracker-intro",
  
  // Phase 4: Body Data Collection
  "body-basics",
  "gender",
  "goal-mode",
  "target-weight",
  "speed-select",
  "planning-setup", // Activity level
  
  // Phase 5: Preferences
  "dietary-preferences",
  "allergies",
  "cooking-time",
  "cooking-experience",
  
  // Phase 6: Analysis & Results
  "analyzing",
  "macro-preview",
  
  // Phase 7: Your Plan with Frigy - Echte Ergebnisse
  "comparison",
  "transformation",
  
  // Phase 8: App Mode Choice - Spontan vs Strukturiert
  "app-mode-choice",
  // Note: spontan-mode-1/2 and structured-mode-1/2/3 are conditional
  // Spontan: permissions → fridge scan → spontan slides
  // Strukturiert: structured slides → permissions
  
  // Phase 9: Notifications (after mode explanation)
  "notification-prefs",
  
  // Phase 10: Save & Finish
  "save-progress",
  "premium-hint",
  "community",
  "celebration",
  "done"
];
