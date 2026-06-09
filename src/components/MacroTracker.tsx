import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  User, Scale, Target, Flame, Camera, Plus, Trash2,
  ChevronRight, Sparkles, TrendingDown, Pencil, Barcode,
  Armchair, Footprints, PersonStanding, Dumbbell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumGate } from '@/contexts/PremiumGateContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { useFoodEntries, FoodEntry as DBFoodEntry } from '@/hooks/useFoodEntries';
import { ScanSuccessOverlay } from './ScanSuccessOverlay';
import { FrigyFoodScanFlow, type FoodScanPhase } from '@/components/scan/FrigyFoodScanFlow';
import { BarcodeScanner } from './BarcodeScanner';
import { EditMacroGoalsDialog, FocusMacro } from './EditMacroGoalsDialog';
import { getEdgeFunctionErrorMessage } from '@/lib/edgeFunctionError';
import { isZeroCalorieFoodName } from '@/lib/zeroCalorieFood';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAppLocale } from '@/lib/mealPlanLanguage';
import { WheelPicker } from './WheelPicker';
import { WeightPicker } from './WeightPicker';
import {
  parseMealFocus,
  normalizeMealTypeForSave,
  type MealFocusKey,
} from '@/lib/mealFocus';
import {
  TrackerAddMealPanel,
  type TrackerRecipeExample,
} from '@/components/tracker/TrackerAddMealPanel';
import { notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import { FRIGY_OPEN_LOG_MEAL, FRIGY_EDIT_TRACKER_GOALS, notifyOverlayOpen } from '@/lib/overlayEvents';
import { getMinCaloriesForAge } from '@/components/onboarding/utils';
import { getLocalDateISO, getLocalDateString } from '@/lib/localDate';
import { dataUrlToBase64Payload, fileToCompressedBase64 } from '@/lib/compressImage';
import { checkImageQuality } from '@/utils/imageQualityCheck';

const ANALYZE_FOOD_TIMEOUT_MS = 45_000;

async function invokeAnalyzeFood(body: { food?: string; imageBase64?: string }) {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error('analyze_food_timeout'));
    }, ANALYZE_FOOD_TIMEOUT_MS);
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  return Promise.race([
    supabase.functions.invoke('analyze-food', { body, headers }),
    timeoutPromise,
  ]) as Promise<{
    data: {
      error?: string;
      message?: string;
      not_found?: boolean;
      name?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      image_url?: string;
    } | null;
    error: unknown;
  }>;
}

// Import animated animal components
import { AnimatedSloth, AnimatedCheetah } from './AnimatedAnimals';
import { AnimatedMotorcycle } from '@/components/onboarding/components/SpeedIcons';

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  image_url?: string;
  meal_type?: MealFocusKey;
}

interface UserProfile {
  age: number;
  weight: number;
  targetWeight: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  mealsPerDay: number;
}

interface MacroTrackerProps {
  onSetupComplete?: () => void;
  onResetTracker?: () => void;
}

export const MacroTracker = ({ onSetupComplete, onResetTracker }: MacroTrackerProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const timeLocale = getAppLocale(language);
  const { user } = useAuth();
  const { ensurePremium } = usePremiumGate();
  const { recordActivity, checkAndAwardBadge } = useGamification();
  const { playSuccess, playClick, playScanStart } = useSoundEffects();
  const { settings: trackerSettings, saveSettings: saveTrackerSettings, resetSettings: resetTrackerSettings, isConfigured, loading: settingsLoading } = useTrackerSettings();
  const { entries: dbEntries, addEntry: addDbEntry, deleteEntry: deleteDbEntry, refreshEntries, todayTotals, loading: foodEntriesLoading } = useFoodEntries();
  
  const [step, setStep] = useState<'onboarding' | 'tracker'>('tracker');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(80);
  const [userHeight, setUserHeight] = useState(170);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState(1.55); // Moderate
  const [weeklyLossRate, setWeeklyLossRate] = useState(0.75); // kg per week
  const [goalMode, setGoalMode] = useState<'lose' | 'gain'>('lose'); // New: lose or gain weight
  const [targetWeight, setTargetWeight] = useState(75);
  const [mealsPerDay, setMealsPerDay] = useState(5); // Number of meals per day
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Sync with database settings
  useEffect(() => {
    if (!settingsLoading) {
      if (isConfigured && trackerSettings) {
        setProfile({
          age: trackerSettings.age,
          weight: trackerSettings.weight,
          targetWeight: trackerSettings.targetWeight,
          dailyCalories: trackerSettings.dailyCalories,
          dailyProtein: trackerSettings.dailyProtein,
          dailyCarbs: trackerSettings.dailyCarbs,
          dailyFat: trackerSettings.dailyFat,
          mealsPerDay: trackerSettings.mealsPerDay,
        });
        setStep('tracker');
        setAge(trackerSettings.age);
        setWeight(trackerSettings.weight);
        setTargetWeight(trackerSettings.targetWeight);
        setGoalMode(trackerSettings.goalMode);
        setWeeklyLossRate(trackerSettings.weeklyGoal);
        setMealsPerDay(trackerSettings.mealsPerDay);
      } else {
        setProfile(null);
        setStep('tracker');
      }
    }
  }, [trackerSettings, isConfigured, settingsLoading]);

  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(() => {
    const saved = localStorage.getItem('todayFood');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === getLocalDateString()) {
        return data.entries;
      }
    }
    return [];
  });
  const [foodInput, setFoodInput] = useState('');
  const [mealPromptKey, setMealPromptKey] = useState<MealFocusKey | null>(null);
  const [logMealPanelOpen, setLogMealPanelOpen] = useState(false);
  const foodTextInputRef = useRef<HTMLInputElement>(null);
  const addFoodSectionRef = useRef<HTMLDivElement>(null);
  const pendingDeletesRef = useRef<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [foodScanError, setFoodScanError] = useState<string | null>(null);
  const [foodScanSuccess, setFoodScanSuccess] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [foodScanPhase, setFoodScanPhase] = useState<FoodScanPhase>('capture');
  const [foodScanProgress, setFoodScanProgress] = useState(0);
  const [showEditGoalsDialog, setShowEditGoalsDialog] = useState(false);
  const [focusMacro, setFocusMacro] = useState<FocusMacro>(null);
  const [lastAnalyzedFood, setLastAnalyzedFood] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [scannedProductData, setScannedProductData] = useState<any>(null);

  const openLogMealPanel = useCallback((focus: MealFocusKey | null = null) => {
    setMealPromptKey(focus);
    setLogMealPanelOpen(true);
  }, []);

  const closeLogMealPanel = useCallback(() => {
    setLogMealPanelOpen(false);
    setMealPromptKey(null);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete("logMeal");
        p.delete("mealFocus");
        return p;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openEditGoalsDialog = useCallback((focus: FocusMacro = "calories") => {
    setFocusMacro(focus);
    setShowEditGoalsDialog(true);
  }, []);

  useEffect(() => {
    const onEditGoals = (event: Event) => {
      const focus = (event as CustomEvent<{ focus?: FocusMacro }>).detail?.focus ?? "calories";
      openEditGoalsDialog(focus);
    };
    window.addEventListener(FRIGY_EDIT_TRACKER_GOALS, onEditGoals);
    return () => window.removeEventListener(FRIGY_EDIT_TRACKER_GOALS, onEditGoals);
  }, [openEditGoalsDialog]);

  const logMealParam = searchParams.get("logMeal");
  const mealFocusParam = searchParams.get("mealFocus");
  const editMacrosParam = searchParams.get("editMacros");
  // Deep link: ?logMeal=1, ?mealFocus=…, ?editMacros=1
  useEffect(() => {
    const logMeal = logMealParam === "1";
    const rawFocus = mealFocusParam;
    const editMacros = editMacrosParam === "1";

    if (step !== "tracker") return;

    if (editMacros) {
      openEditGoalsDialog("calories");
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete("editMacros");
          return p;
        },
        { replace: true },
      );
      return;
    }

    if (!logMeal && !rawFocus) {
      return;
    }

    const focus = rawFocus ? parseMealFocus(rawFocus) : null;
    openLogMealPanel(focus);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete("mealFocus");
        p.delete("logMeal");
        return p;
      },
      { replace: true },
    );
  }, [step, logMealParam, mealFocusParam, editMacrosParam, setSearchParams, openLogMealPanel, openEditGoalsDialog]);

  useEffect(() => {
    const onOpenLogMeal = (event: Event) => {
      if (step !== "tracker") return;
      const focus =
        (event as CustomEvent<{ focus?: MealFocusKey | null }>).detail?.focus ?? null;
      openLogMealPanel(focus);
    };
    window.addEventListener(FRIGY_OPEN_LOG_MEAL, onOpenLogMeal);
    return () => {
      window.removeEventListener(FRIGY_OPEN_LOG_MEAL, onOpenLogMeal);
      notifyOverlayOpen(false);
    };
  }, [step, openLogMealPanel]);

  // Animated analyzing messages - use translations
  const analyzingMessages = [
    t.analyzingFood,
    t.patienceMessage,
    t.calculatingCalories,
    t.determiningNutrients,
    t.almostDone
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (isAnalyzing && analyzingImage) {
      const interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % analyzingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setCurrentMessageIndex(0);
    }
  }, [isAnalyzing, analyzingImage]);

  const mapDbEntriesToTrackerEntries = useCallback((entries: DBFoodEntry[]): FoodEntry[] => {
    return entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      time: new Date(entry.created_at).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' }),
      image_url: entry.image_url,
      meal_type: parseMealFocus(entry.meal_type ?? null) ?? undefined,
    }));
  }, []);

  useEffect(() => {
    if (!user || foodEntriesLoading) return;

    const dbIds = new Set(dbEntries.map((e) => e.id));
    for (const pendingId of pendingDeletesRef.current) {
      if (!dbIds.has(pendingId)) pendingDeletesRef.current.delete(pendingId);
    }

    const freshEntries = mapDbEntriesToTrackerEntries(dbEntries).filter(
      (e) => !pendingDeletesRef.current.has(e.id),
    );
    setFoodEntries(freshEntries);

    localStorage.setItem('todayFood', JSON.stringify({
      date: getLocalDateString(),
      entries: freshEntries,
    }));
    notifyFrigyStorageUpdated();
  }, [dbEntries, foodEntriesLoading, mapDbEntriesToTrackerEntries, user]);

  // Expose reset function to parent
  const resetTracker = async () => {
    await resetTrackerSettings();
    localStorage.removeItem('todayFood');
    notifyFrigyStorageUpdated();
    setProfile(null);
    setFoodEntries([]);
    setLogMealPanelOpen(false);
    onResetTracker?.();
  };

  // Make resetTracker available via ref or callback
  useEffect(() => {
    // Store the reset function in window for chatbot access
    (window as any).__resetMacroTracker = resetTracker;
    return () => {
      delete (window as any).__resetMacroTracker;
    };
  }, []);

  // Mifflin-St Jeor BMR formula
  const bmr = gender === 'male' 
    ? 10 * weight + 6.25 * userHeight - 5 * age + 5 
    : 10 * weight + 6.25 * userHeight - 5 * age - 161;
  const tdee = Math.round(bmr * activityLevel);
  
  // Calculate based on user-selected weekly rate and goal mode
  const weightDiff = goalMode === 'lose' ? weight - targetWeight : targetWeight - weight;
  const weeksToGoal = weightDiff > 0 ? Math.ceil(weightDiff / weeklyLossRate) : 0;
  
  // Calculate daily adjustment: 7700 kcal = 1kg
  const dailyAdjustment = (weeklyLossRate * 7700) / 7;
  
  // Calculate target calories based on goal mode
  const calculatedCalories = goalMode === 'lose' 
    ? Math.round(tdee - dailyAdjustment)
    : Math.round(tdee + dailyAdjustment);
  const minCalories = getMinCaloriesForAge(age);
  const maxCalories = tdee + 1500; // Max surplus for gaining
  const targetCalories = goalMode === 'lose' 
    ? Math.max(minCalories, calculatedCalories)
    : Math.min(maxCalories, calculatedCalories);
  const isAtMinimum = goalMode === 'lose' && calculatedCalories < minCalories;
  
  // Protein: Higher for gaining (2.2g/kg), standard for losing (2g/kg)
  const targetProtein = Math.round(weight * (goalMode === 'gain' ? 2.2 : 2));
  // Fat: 0.8-1g per kg
  const targetFat = Math.round(weight * 0.9);
  // Carbs: remaining calories (must sum to total calories)
  const proteinCalories = targetProtein * 4;
  const fatCalories = targetFat * 9;
  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const targetCarbs = Math.max(0, Math.round(carbCalories / 4));

  // Verify the macros sum correctly to targetCalories
  const calculatedTotalCalories = (targetProtein * 4) + (targetFat * 9) + (targetCarbs * 4);
  console.log('[MACRO-CALCULATION]', {
    targetCalories,
    targetProtein,
    targetFat,
    targetCarbs,
    calculatedTotal: calculatedTotalCalories,
    match: calculatedTotalCalories >= targetCalories * 0.95
  });

  const showMealPlanRefreshToast = () => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>{t.regenerateWeeklyPlan}</span>
        </div>
      ),
      description: t.macroGoalsChangedToast,
      action: (
        <ToastAction altText={t.ariaGenerateWeeklyPlan} onClick={() => navigate('/meal-plans?tab=meals&regenerate=1')}>
          Wochenplan generieren
        </ToastAction>
      ),
    });
  };

  const saveProfile = async () => {
    const newProfile = {
      age,
      weight,
      targetWeight,
      dailyCalories: targetCalories,
      dailyProtein: targetProtein,
      dailyCarbs: targetCarbs,
      dailyFat: targetFat,
      mealsPerDay,
    };

    // Save to database via hook
    await saveTrackerSettings({
      age,
      weight,
      targetWeight,
      goalMode,
      weeklyGoal: weeklyLossRate,
      dailyCalories: targetCalories,
      dailyProtein: targetProtein,
      dailyCarbs: targetCarbs,
      dailyFat: targetFat,
      mealsPerDay,
    });

    setProfile(newProfile);
    setStep('tracker');

    if (profile) {
      const profileChanged =
        profile.dailyCalories !== newProfile.dailyCalories ||
        profile.dailyProtein !== newProfile.dailyProtein ||
        profile.dailyCarbs !== newProfile.dailyCarbs ||
        profile.dailyFat !== newProfile.dailyFat ||
        profile.targetWeight !== newProfile.targetWeight ||
        profile.weight !== newProfile.weight ||
        profile.age !== newProfile.age;

      if (profileChanged) {
        showMealPlanRefreshToast();
      }
    }

    onSetupComplete?.();
  };

  // Sync macros to database
  const syncMacrosToDatabase = useCallback(async (entries: FoodEntry[]) => {
    if (!user) return;
    
    const totalCals = entries.reduce((sum, e) => sum + e.calories, 0);
    const totalProt = entries.reduce((sum, e) => sum + e.protein, 0);
    const totalCarb = entries.reduce((sum, e) => sum + e.carbs, 0);
    const totalFats = entries.reduce((sum, e) => sum + e.fat, 0);
    
    const today = getLocalDateISO();
    
    try {
      const { error } = await supabase
        .from('daily_macros')
        .upsert({
          user_id: user.id,
          date: today,
          calories: totalCals,
          protein: totalProt,
          carbs: totalCarb,
          fat: totalFats,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        });

      if (error) {
        const errorMsg = error?.message || error?.details || JSON.stringify(error);
        console.error('[MACRO-SYNC] Error syncing macros:', errorMsg, error);
      } else {
        console.log('[MACRO-SYNC] Successfully synced to DB:', { calories: totalCals, protein: totalProt, date: today });
      }
    } catch (e: any) {
      const errorMsg = e?.message || JSON.stringify(e);
      console.error('[MACRO-SYNC] Failed to sync macros:', errorMsg);
      // Silently fail - daily_macros is auxiliary data only
    }
  }, [user]);

  const saveFoodEntries = useCallback((entries: FoodEntry[]) => {
    localStorage.setItem('todayFood', JSON.stringify({
      date: getLocalDateString(),
      entries,
    }));
    notifyFrigyStorageUpdated();
    setFoodEntries(entries);
    
    // Sync to database
    syncMacrosToDatabase(entries);
  }, [syncMacrosToDatabase]);

  const analyzeFood = async (
    food: string,
    imageBase64?: string,
    mealType: MealFocusKey | null = mealPromptKey,
  ): Promise<boolean> => {
    if (!(await ensurePremium())) return false;

    const resolvedMealType = normalizeMealTypeForSave(mealType);

    setIsAnalyzing(true);
    setFoodScanError(null);
    let scanFlowSettled = false;
    let progressInterval: number | null = null;
    if (imageBase64) {
      setFoodScanPhase('analyzing');
      setAnalyzingImage(`data:image/jpeg;base64,${imageBase64}`);
      setFoodScanProgress(10);
      progressInterval = window.setInterval(() => {
        setFoodScanProgress((prev) => (prev < 88 ? prev + Math.random() * 6 + 2 : prev + 0.4));
      }, 280);
      playScanStart();
    }
    let succeeded = false;
    try {
      const body: { food?: string; imageBase64?: string } = {};
      if (food && food.trim()) body.food = food.trim();
      if (imageBase64) body.imageBase64 = imageBase64;

      const { data, error: invokeError } = await invokeAnalyzeFood(body);

      if (invokeError) {
        const errorMsg = await getEdgeFunctionErrorMessage(
          invokeError,
          data as { error?: string; message?: string; not_found?: boolean } | null,
        );
        console.error('[ANALYZE-FOOD] Function error:', errorMsg);
        throw new Error(errorMsg || t.couldNotAnalyzeFood);
      }

      if (!data) {
        throw new Error(t.noAnalysisData);
      }

      if (data?.not_found) {
        throw new Error(t.foodNotFound);
      }

      if (data?.error) {
        throw new Error(
          typeof data.message === 'string' && data.message
            ? data.message
            : data.not_found
              ? t.foodNotFound
              : String(data.error),
        );
      }

      const calories = typeof data.calories === "number" ? data.calories : -1;
      const allowZeroCal = calories === 0 && isZeroCalorieFoodName(data.name);
      if (!data.name || calories < 0 || (calories <= 0 && !allowZeroCal)) {
        throw new Error(t.foodNotFound);
      }

      const scanResult = {
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      };

      if (imageBase64) {
        setLastAnalyzedFood(scanResult);
        setFoodScanError(null);
        setFoodScanSuccess(scanResult);
        setFoodScanPhase('success');
        setFoodScanProgress(100);
        scanFlowSettled = true;
        playSuccess();
      }

      // Save to database with image_url (after UI update so scan flow never hangs)
      let savedEntry;
      try {
        savedEntry = await addDbEntry({
          name: data.name,
          calories: Math.round(data.calories),
          protein: Math.round(data.protein || 0),
          carbs: Math.round(data.carbs || 0),
          fat: Math.round(data.fat || 0),
          meal_type: resolvedMealType,
          image_url: data.image_url,
        });
      } catch (dbError: unknown) {
        console.error('Database save error:', dbError);
        savedEntry = null;
      }

      const newEntry: FoodEntry = {
        id: savedEntry?.id || Date.now().toString(),
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        time: new Date().toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' }),
        image_url: data.image_url,
        meal_type: resolvedMealType,
      };

      saveFoodEntries([...foodEntries, newEntry]);
      setFoodInput('');

      if (!imageBase64) {
        closeLogMealPanel();
        toast({ title: t.foodAdded, description: `${data.name} - ${data.calories} kcal` });
        playClick();
      }

      recordActivity();
      checkAndAwardBadge('meal_logged');
      if (imageBase64) {
        void checkAndAwardBadge('first_scan');
      }
      succeeded = true;
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString?.() || t.couldNotAnalyzeFood;
      console.error('Error analyzing food:', errorMsg, error);
      if (imageBase64) {
        const timeoutMsg =
          errorMsg === "analyze_food_timeout" ? t.foodAnalyzeTimeout : null;
        const looksLikeNotFood =
          /essen nicht|not.?found|kein essen|no food|pas de nourriture|nicht erkannt/i.test(errorMsg);
        setFoodScanError(
          timeoutMsg ?? (looksLikeNotFood ? t.foodNotFoodHint : errorMsg),
        );
        setFoodScanPhase('error');
        scanFlowSettled = true;
      } else {
        toast({
          title: t.foodNotFound || t.error,
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      if (progressInterval != null) {
        window.clearInterval(progressInterval);
      }
      setIsAnalyzing(false);
    }

    if (!imageBase64) {
      setAnalyzingImage(null);
      setShowFoodCamera(false);
      setFoodScanPhase('capture');
      notifyOverlayOpen(false);
    } else if (!scanFlowSettled && !succeeded) {
      setFoodScanError((prev) => prev ?? t.couldNotAnalyzeFood);
      setFoodScanPhase('error');
    }

    return succeeded;
  };

  const resetFoodScanToCapture = () => {
    setFoodScanError(null);
    setFoodScanSuccess(null);
    setAnalyzingImage(null);
    setFoodScanProgress(0);
    setFoodScanPhase('capture');
  };

  const dismissFoodScanFlow = () => {
    resetFoodScanToCapture();
    setShowFoodCamera(false);
    notifyOverlayOpen(false);
  };

  const openFoodCamera = () => {
    void (async () => {
      if (!(await ensurePremium())) return;
      setLogMealPanelOpen(false);
      resetFoodScanToCapture();
      setShowFoodCamera(true);
      notifyOverlayOpen(true);
    })();
  };

  const scanAnotherFoodFromCamera = () => {
    setIsAnalyzing(false);
    setFoodScanError(null);
    setFoodScanSuccess(null);
    setAnalyzingImage(null);
    setFoodScanProgress(0);
    setFoodScanPhase('capture');
    setShowFoodCamera(true);
    notifyOverlayOpen(true);
  };

  const closeFoodCamera = () => {
    setIsAnalyzing(false);
    dismissFoodScanFlow();
  };

  const removeEntry = async (id: string) => {
    if (pendingDeletesRef.current.has(id)) return;
    pendingDeletesRef.current.add(id);

    setFoodEntries((prev) => {
      const nextEntries = prev.filter((e) => e.id !== id);
      localStorage.setItem('todayFood', JSON.stringify({
        date: getLocalDateString(),
        entries: nextEntries,
      }));
      notifyFrigyStorageUpdated();
      void syncMacrosToDatabase(nextEntries);
      return nextEntries;
    });

    try {
      if (user && id.length > 15) {
        const ok = await deleteDbEntry(id);
        if (!ok) {
          pendingDeletesRef.current.delete(id);
          void refreshEntries();
        }
      } else {
        pendingDeletesRef.current.delete(id);
      }
    } catch {
      pendingDeletesRef.current.delete(id);
      void refreshEntries();
    }
  };

  const editEntry = (entry: FoodEntry) => {
    navigate(`/food-entry/${entry.id}`);
  };

  const processCameraFile = (file: File) => {
    void (async () => {
      if (!(await ensurePremium())) return;

      setLogMealPanelOpen(false);
      setShowFoodCamera(true);
      notifyOverlayOpen(true);
      setFoodScanPhase('analyzing');
      setIsAnalyzing(true);
      setFoodScanError(null);
      setFoodScanSuccess(null);
      setAnalyzingImage(URL.createObjectURL(file));

      const dataUrl = await fileToCompressedBase64(file);
      if (!dataUrl) {
        setIsAnalyzing(false);
        setFoodScanError(t.foodPhotoReadError);
        setFoodScanPhase('error');
        return;
      }

      const qualityCheck = await checkImageQuality(dataUrl);
      if (!qualityCheck.isGoodQuality) {
        setIsAnalyzing(false);
        setFoodScanError(qualityCheck.suggestion || qualityCheck.message);
        setFoodScanPhase('error');
        return;
      }

      const base64 = dataUrlToBase64Payload(dataUrl);
      setAnalyzingImage(dataUrl.startsWith('data:') ? dataUrl : `data:image/jpeg;base64,${base64}`);
      await analyzeFood('', base64, mealPromptKey);
    })();
  };

  const handleBarcodeClick = () => {
    void (async () => {
      if (!(await ensurePremium())) return;
      setLogMealPanelOpen(false);
      setShowBarcodeScanner(true);
      notifyOverlayOpen(true);
    })();
  };

  const addRecipeToTracker = async (recipe: TrackerRecipeExample) => {
    try {
      let savedEntry;
      try {
        savedEntry = await addDbEntry({
          name: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          meal_type: normalizeMealTypeForSave(mealPromptKey),
        });
      } catch {
        savedEntry = null;
      }

      const newEntry: FoodEntry = {
        id: savedEntry?.id || Date.now().toString(),
        name: recipe.title,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        time: new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" }),
        meal_type: normalizeMealTypeForSave(mealPromptKey),
      };
      saveFoodEntries([...foodEntries, newEntry]);
      closeLogMealPanel();
      toast({
        title: t.foodAdded,
        description: `${recipe.title} · ${recipe.calories} kcal`,
      });
      playClick();
      recordActivity();
      checkAndAwardBadge("meal_logged");
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast({ title: t.error, description: t.toastRecipeAddFailed, variant: "destructive" });
    }
  };

  const handleBarcodeScanned = async (food: any) => {
    setScannedProductData(food);
    setShowSuccessOverlay(true);
    setShowBarcodeScanner(false);
    notifyOverlayOpen(false);

    let savedEntry;
    try {
      savedEntry = await addDbEntry({
        name: food.name,
        calories: Math.round(food.calories || 0),
        protein: Math.round(food.protein || 0),
        carbs: Math.round(food.carbs || 0),
        fat: Math.round(food.fat || 0),
        meal_type: normalizeMealTypeForSave(mealPromptKey),
        image_url: food.image,
      });
    } catch {
      savedEntry = null;
    }

    // Automatically add to entries
    const newEntry: FoodEntry = {
      id: savedEntry?.id || Date.now().toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      time: new Date().toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' }),
      image_url: food.image,
      meal_type: normalizeMealTypeForSave(mealPromptKey),
    };
    saveFoodEntries([...foodEntries, newEntry]);
    recordActivity();
    checkAndAwardBadge('meal_logged');
    void checkAndAwardBadge('first_scan');
    playSuccess();
    setLastAnalyzedFood(food);
  };

  const totalCalories = foodEntries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = foodEntries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = foodEntries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = foodEntries.reduce((sum, e) => sum + e.fat, 0);

  // Get speed label and emoji based on weeklyLossRate
  const getSpeedInfo = () => {
    if (weeklyLossRate <= 0.5) return { emoji: '🐢', label: t.trackerPaceSlow, color: 'text-green-400' };
    if (weeklyLossRate <= 0.75) return { emoji: '🐇', label: t.trackerPaceModerate, color: 'text-amber-400' };
    if (weeklyLossRate <= 1) return { emoji: '🐆', label: t.trackerPaceFast, color: 'text-orange-400' };
    return { emoji: '🚀', label: t.trackerPaceVeryFast, color: 'text-red-400' };
  };
  const speedInfo = getSpeedInfo();

  const editGoalsCurrent = useMemo(
    () => ({
      dailyCalories: profile?.dailyCalories ?? trackerSettings?.dailyCalories ?? 2000,
      dailyProtein: profile?.dailyProtein ?? trackerSettings?.dailyProtein ?? 150,
      dailyCarbs: profile?.dailyCarbs ?? trackerSettings?.dailyCarbs ?? 200,
      dailyFat: profile?.dailyFat ?? trackerSettings?.dailyFat ?? 70,
    }),
    [
      profile?.dailyCalories,
      profile?.dailyProtein,
      profile?.dailyCarbs,
      profile?.dailyFat,
      trackerSettings?.dailyCalories,
      trackerSettings?.dailyProtein,
      trackerSettings?.dailyCarbs,
      trackerSettings?.dailyFat,
    ],
  );

  const onboardingSteps = [
    {
      icon: PersonStanding,
      title: t.trackerYourBodyData,
      subtitle: t.trackerScrollToSet,
      content: (
        <div className="w-full">
          {/* Three wheel pickers side by side - like OnboardingFlow */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Height Picker */}
            <motion.div 
              className="rounded-2xl bg-background border-2 border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                <PersonStanding className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t.trackerHeight}</span>
              </div>
              <WheelPicker
                value={userHeight}
                onChange={setUserHeight}
                min={60}
                max={220}
                step={1}
                unit="cm"
              />
            </motion.div>
            
            {/* Weight Picker */}
            <motion.div 
              className="rounded-2xl bg-background border-2 border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                <Scale className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t.trackerWeight}</span>
              </div>
              <WheelPicker
                value={weight}
                onChange={setWeight}
                min={10}
                max={250}
                step={1}
                unit="kg"
              />
            </motion.div>
            
            {/* Age Picker */}
            <motion.div 
              className="rounded-2xl bg-background border-2 border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                <User className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t.trackerAge}</span>
              </div>
              <WheelPicker
                value={age}
                onChange={setAge}
                min={10}
                max={100}
                step={1}
                unit={t.trackerYearsShort}
              />
            </motion.div>
          </div>
          
          <motion.div
            className="flex items-center gap-2 justify-center px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <span className="text-sm">🔒</span>
            <span className="text-xs text-muted-foreground/60">{t.trackerPrivate}</span>
          </motion.div>
        </div>
      ),
    },
    {
      icon: User,
      title: t.trackerYourGender,
      subtitle: t.trackerGenderImportant,
      content: (
        <div className="grid grid-cols-2 gap-4 w-full">
          {[
            { id: 'male' as const, label: t.trackerMale, color: 'from-blue-500/20 to-cyan-500/20' },
            { id: 'female' as const, label: t.trackerFemale, color: 'from-pink-500/20 to-rose-500/20' },
          ].map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGender(option.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden ${
                gender === option.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-50`} />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-card/80 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      icon: Flame,
      title: t.trackerHowActive,
      subtitle: t.trackerForCalories,
      content: (
        <div className="space-y-3 w-full">
          {[
            { value: 1.2, label: t.trackerLowActive, desc: t.trackerLowActiveDesc, icon: Armchair, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
            { value: 1.375, label: t.trackerLightActive, desc: t.trackerLightActiveDesc, icon: Footprints, color: 'text-green-500', bgColor: 'bg-green-500/20' },
            { value: 1.55, label: t.trackerModerateActive, desc: t.trackerModerateActiveDesc, icon: PersonStanding, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
            { value: 1.725, label: t.trackerVeryActive, desc: t.trackerVeryActiveDesc, icon: Dumbbell, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
          ].map((level) => {
            const IconComponent = level.icon;
            return (
              <motion.button
                key={level.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActivityLevel(level.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${activityLevel === level.value ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${level.bgColor} flex items-center justify-center ${level.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{level.label}</p>
                    <p className="text-sm text-muted-foreground">{level.desc}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ),
    },
    {
      icon: Target,
      title: t.trackerYourGoal,
      subtitle: t.trackerLoseOrGain,
      content: (
        <div className="w-full space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setGoalMode('lose');
                setTargetWeight(Math.max(40, weight - 5));
              }}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                goalMode === 'lose' ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-lg font-bold block">{t.trackerLoseWeight}</span>
              <span className="text-xs text-muted-foreground/60">{t.trackerCalorieDeficit}</span>
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setGoalMode('gain');
                setTargetWeight(Math.min(200, weight + 5));
              }}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                goalMode === 'gain' ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-green-500 rotate-180" />
              </div>
              <span className="text-lg font-bold block">{t.trackerGainWeight}</span>
              <span className="text-xs text-muted-foreground/60">{t.trackerCalorieSurplus}</span>
            </motion.button>
          </div>
        </div>
      ),
    },
    {
      icon: Scale,
      title: t.trackerYourTargetWeight,
      subtitle: goalMode === 'lose' ? t.trackerHowMuchLose : t.trackerHowMuchGain,
      content: (
        <div className="w-full space-y-6">
          <motion.div 
            className="relative h-32 flex items-end justify-center gap-8 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-16 bg-muted-foreground/30 rounded-t-xl"
                initial={{ height: 0 }}
                animate={{ height: 70 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              />
              <span className="text-xs text-muted-foreground/60 mt-2">{t.trackerCurrent}</span>
              <span className="text-lg font-bold">{weight}kg</span>
            </div>
            
            <motion.div 
              className="flex items-center gap-1 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <span className="text-2xl">→</span>
            </motion.div>
            
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-16 bg-primary rounded-t-xl"
                initial={{ height: 0 }}
                animate={{ height: goalMode === 'lose' ? 70 - weightDiff * 3 : 70 + weightDiff * 2 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ minHeight: 25, maxHeight: 100 }}
              />
              <span className="text-xs text-primary mt-2">{t.trackerGoalLabel}</span>
              <span className="text-lg font-bold text-primary">{targetWeight}kg</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="p-4 rounded-2xl bg-card border-2 border-border"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">
                {goalMode === 'lose' ? t.trackerWeightLoss : t.trackerWeightGain}
              </span>
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                {goalMode === 'lose' ? '-' : '+'}{weightDiff}kg
              </div>
            </div>
            <input
              type="range" 
              min={goalMode === 'lose' ? Math.max(40, weight - 20) : weight} 
              max={goalMode === 'lose' ? weight - 1 : weight + 20} 
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseInt(e.target.value))}
              className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
          </motion.div>
        </div>
      ),
    },
    {
      icon: TrendingDown,
      title: t.trackerYourSpeed,
      subtitle: goalMode === 'lose' ? t.trackerHowFastLose : t.trackerHowFastGain,
      content: (
        <div className="w-full space-y-6">
          {/* Speed Value Display */}
          <div className="text-center">
            <span className="text-5xl font-bold text-primary">{weeklyLossRate.toFixed(1)}</span>
            <span className="text-xl text-muted-foreground ml-2">{t.trackerKgPerWeek}</span>
          </div>
          
          {/* Animal Icons */}
          <div className="relative h-20 flex items-end justify-between px-4">
            <div className={`transition-all duration-200 ${weeklyLossRate <= 0.5 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
              <AnimatedSloth isActive={weeklyLossRate <= 0.5} />
            </div>
            <div className={`transition-all duration-200 ${weeklyLossRate > 0.5 && weeklyLossRate <= 1.0 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
              <AnimatedMotorcycle selected={weeklyLossRate > 0.5 && weeklyLossRate <= 1.0} />
            </div>
            <div className={`transition-all duration-200 ${weeklyLossRate > 1.0 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
              <AnimatedCheetah isActive={weeklyLossRate > 1.0} />
            </div>
          </div>
          
          {/* Slider */}
          <div className="space-y-2 px-2">
            <Slider
              value={[weeklyLossRate * 100]}
              onValueChange={([v]) => setWeeklyLossRate(v / 100)}
              min={10}
              max={150}
              step={5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.trackerSlowSustainable}</span>
              <span>{t.trackerModerate}</span>
              <span>{t.trackerFast}</span>
            </div>
          </div>
          
          {/* Quick select */}
          <div className="flex gap-2 justify-center">
            {[0.3, 0.5, 0.8, 1.0, 1.2].map((speed) => (
              <button
                key={speed}
                onClick={() => setWeeklyLossRate(speed)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  Math.abs(weeklyLossRate - speed) < 0.05
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
          
          {/* Info based on speed */}
          <div className={`text-sm p-3 rounded-lg text-center ${weeklyLossRate > 1.0 ? 'bg-red-500/10 text-red-400' : weeklyLossRate > 0.75 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
            {weeklyLossRate > 1.0 && `⚠️ ${t.trackerHighDiscipline}`}
            {weeklyLossRate > 0.75 && weeklyLossRate <= 1.0 && "👍 " + t.trackerFast}
            {weeklyLossRate <= 0.75 && `✅ ${t.trackerRecommended}`}
          </div>
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: t.yourPersonalPlan,
      subtitle: t.trackerPersonalMacroPlan,
      content: (
        <div className="space-y-4 text-center w-full">
          <div className="p-6 bg-primary/10 rounded-2xl">
            <Flame className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="text-4xl font-bold text-primary">{targetCalories}</p>
            <p className="text-muted-foreground">{t.caloriesPerDay}</p>
          </div>
          
          <div className="text-sm text-muted-foreground bg-background/30 rounded-lg p-3 space-y-1">
            <p>{t.baseMetabolism}: ~{bmr.toFixed(0)} kcal</p>
            <p>{t.withActivity}: ~{tdee} kcal</p>
            <p>{goalMode === 'lose' ? t.deficit : 'Überschuss'}: {goalMode === 'lose' ? '-' : '+'}{Math.round(dailyAdjustment)} kcal/Tag</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-blue-400">{targetProtein}g</p>
              <p className="text-xs text-muted-foreground">{t.protein}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-orange-400">{targetCarbs}g</p>
              <p className="text-xs text-muted-foreground">{t.carbs}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-emerald-400">{targetFat}g</p>
              <p className="text-xs text-muted-foreground">{t.fat}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Plus,
      title: t.trackerMealsPerDayTitle,
      subtitle: t.trackerMealsPerDaySubtitle,
      content: (
        <div className="w-full space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[3, 4, 5, 6].map((option) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: option === 3 ? 0 : (option - 3) * 0.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMealsPerDay(option)}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  mealsPerDay === option ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <span className="text-2xl font-bold block">{option}</span>
                <span className="text-xs text-muted-foreground/60">{t.trackerMealsUnit}</span>
              </motion.button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground bg-background/30 rounded-lg p-3">
            <p>{t.trackerSetupLaterHint}</p>
          </div>
        </div>
      ),
    },
  ];

  if (step === 'onboarding') {
    const currentStepData = onboardingSteps[onboardingStep];
    const Icon = currentStepData.icon;

    return (
      <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-background px-4 py-6 safe-top safe-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-2">
          {onboardingSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === onboardingStep ? 'w-8 bg-primary' : 'w-1.5 bg-primary/30'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-5 bg-card/90 backdrop-blur-xl border-border/30 shadow-lg">
              {/* Header */}
              <div className="flex flex-col items-center mb-4">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ duration: 0.4 }} 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-lg"
                >
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-center">{currentStepData.title}</h3>
                {currentStepData.subtitle && (
                  <p className="text-muted-foreground/50 text-xs mt-1">{currentStepData.subtitle}</p>
                )}
              </div>
              
              {/* Content */}
              <div className="min-h-[200px] max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain flex flex-col justify-center">
                {currentStepData.content}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-border/20">
                {onboardingStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setOnboardingStep(prev => prev - 1)}
                    className="flex-1"
                  >
                    {t.back}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (onboardingStep < onboardingSteps.length - 1) {
                      setOnboardingStep(prev => prev + 1);
                    } else {
                      saveProfile();
                    }
                  }}
                  className="flex-1"
                >
                  {onboardingStep < onboardingSteps.length - 1 ? (
                    <>{t.next} <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>{t.letsGo} <Sparkles className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      {/* Edit Macro Goals Dialog */}
      <EditMacroGoalsDialog
        open={showEditGoalsDialog}
        onOpenChange={(open) => {
          setShowEditGoalsDialog(open);
          if (!open) setFocusMacro(null);
        }}
        currentGoals={editGoalsCurrent}
        focusMacro={focusMacro}
        weightKg={trackerSettings?.weight ?? weight}
        onSave={async (goals) => {
          const previous = profile ?? {
            age: trackerSettings?.age ?? age,
            weight: trackerSettings?.weight ?? weight,
            targetWeight: trackerSettings?.targetWeight ?? targetWeight,
            dailyCalories: trackerSettings?.dailyCalories ?? goals.dailyCalories,
            dailyProtein: trackerSettings?.dailyProtein ?? goals.dailyProtein,
            dailyCarbs: trackerSettings?.dailyCarbs ?? goals.dailyCarbs,
            dailyFat: trackerSettings?.dailyFat ?? goals.dailyFat,
            mealsPerDay: trackerSettings?.mealsPerDay ?? mealsPerDay,
          };

          const mealPlanNeedsRefresh =
            previous.dailyCalories !== goals.dailyCalories ||
            previous.dailyProtein !== goals.dailyProtein ||
            previous.dailyCarbs !== goals.dailyCarbs ||
            previous.dailyFat !== goals.dailyFat;

          const newProfile = {
            ...previous,
            dailyCalories: goals.dailyCalories,
            dailyProtein: goals.dailyProtein,
            dailyCarbs: goals.dailyCarbs,
            dailyFat: goals.dailyFat,
          };

          setProfile(newProfile);

          await saveTrackerSettings({
            age: trackerSettings?.age ?? age,
            weight: trackerSettings?.weight ?? weight,
            targetWeight: trackerSettings?.targetWeight ?? targetWeight,
            goalMode: trackerSettings?.goalMode ?? goalMode,
            weeklyGoal: trackerSettings?.weeklyGoal ?? weeklyLossRate,
            dailyCalories: goals.dailyCalories,
            dailyProtein: goals.dailyProtein,
            dailyCarbs: goals.dailyCarbs,
            dailyFat: goals.dailyFat,
            mealsPerDay: trackerSettings?.mealsPerDay ?? mealsPerDay,
            dietaryPreferences: trackerSettings?.dietaryPreferences,
            healthGoals: trackerSettings?.healthGoals,
            allergies: trackerSettings?.allergies,
            allergiesOther: trackerSettings?.allergiesOther,
          });

          if (mealPlanNeedsRefresh) {
            showMealPlanRefreshToast();
          }

          onSetupComplete?.();
        }}
      />

      <AnimatePresence mode="wait">
        {logMealPanelOpen && (
          <TrackerAddMealPanel
            key="tracker-add-meal-panel"
            mealFocus={mealPromptKey}
            onClose={closeLogMealPanel}
            onSearchSubmit={(text) => analyzeFood(text, undefined, mealPromptKey)}
            onOpenLiveCamera={openFoodCamera}
            onCameraFile={processCameraFile}
            onBarcode={handleBarcodeClick}
            onAddRecipe={addRecipeToTracker}
            onDeleteMeal={removeEntry}
            onEditMeal={(id) => {
              const entry = foodEntries.find((e) => e.id === id);
              if (entry) editEntry(entry);
            }}
            loggedMeals={foodEntries.map((e) => ({
              id: e.id,
              name: e.name,
              calories: e.calories,
              time: e.time,
              mealType: e.meal_type,
            }))}
            isAnalyzing={isAnalyzing}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFoodCamera && (
          <FrigyFoodScanFlow
            key="food-scan-flow"
            open={showFoodCamera}
            phase={foodScanPhase}
            analyzing={isAnalyzing}
            analyzingLabel={analyzingMessages[currentMessageIndex]}
            analyzingProgress={foodScanProgress}
            previewImage={analyzingImage}
            analysisErrorMessage={foodScanError}
            successResult={foodScanSuccess}
            onClose={closeFoodCamera}
            onCapture={processCameraFile}
            onSuccessDismiss={dismissFoodScanFlow}
            onScanAnotherAfterSuccess={scanAnotherFoodFromCamera}
            onRetryAfterError={resetFoodScanToCapture}
          />
        )}
      </AnimatePresence>

      {/* Success Overlay after successful scan */}
      <ScanSuccessOverlay
        isVisible={showSuccessOverlay}
        foodName={lastAnalyzedFood?.name || ''}
        calories={lastAnalyzedFood?.calories || 0}
        protein={lastAnalyzedFood?.protein || 0}
        carbs={lastAnalyzedFood?.carbs || 0}
        fat={lastAnalyzedFood?.fat || 0}
        onComplete={() => {
          setShowSuccessOverlay(false);
          setAnalyzingImage(null);
        }}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => {
          setShowBarcodeScanner(false);
          notifyOverlayOpen(false);
        }}
        onFoodScanned={handleBarcodeScanned}
      />

    </>
  );
};