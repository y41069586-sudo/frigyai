import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { OnboardingStep } from "@/components/onboarding/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAICache } from "@/hooks/useAICache";
import { checkImageQuality } from "@/utils/imageQualityCheck";
import { validateImageFileSize, VALIDATION_RULES } from "@/utils/validation";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import { SHOPPING_CHECKED_NAMES_KEY } from "@/lib/shoppingSync";
import { FrigyIngredientScanFlow } from "@/components/scan/FrigyIngredientScanFlow";

interface ScanShoppingItem {
  name: string;
  amount: string;
  price: number;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const ANALYZE_INGREDIENTS_TIMEOUT_MS = 45_000;

type ScanNavState = {
  fromOnboarding?: boolean;
  returnToOnboarding?: boolean;
  nextOnboardingStep?: OnboardingStep;
};

async function invokeAnalyzeIngredientsWithTimeout(body: { image: string; isOnboarding: boolean }) {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("analyze_ingredients_timeout"));
    }, ANALYZE_INGREDIENTS_TIMEOUT_MS);
  });

  return Promise.race([
    supabase.functions.invoke("analyze-ingredients", { body }),
    timeoutPromise,
  ]) as Promise<{ data: { error?: string; message?: string; ingredients?: string[] } | null; error: unknown }>;
}

const ScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scanNav = (location.state ?? {}) as ScanNavState;
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<ScanShoppingItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const photoQueueRef = useRef<File[]>([]);

  const { getCached, setCached } = useAICache();

  const normalizeIngredientName = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9äöüß\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const readShoppingSource = (): ScanShoppingItem[] => {
    try {
      const rawList = localStorage.getItem("weeklyShoppingList");
      if (rawList) {
        const parsed = JSON.parse(rawList) as ScanShoppingItem[];
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item) => item?.name)
            .map((item) => ({
              name: item.name,
              amount: item.amount || "—",
              price: typeof item.price === "number" ? item.price : 0,
            }));
        }
      }
    } catch {
      /* fall through */
    }

    try {
      const rawPlan = localStorage.getItem("weeklyMealPlan");
      const plan = rawPlan ? JSON.parse(rawPlan) : [];
      if (!Array.isArray(plan)) return [];

      const map = new Map<string, ScanShoppingItem>();
      plan.forEach((day: { meals?: { ingredients?: ScanShoppingItem[] }[] }) => {
        day.meals?.forEach((meal) => {
          meal.ingredients?.forEach((ingredient) => {
            if (!ingredient?.name) return;
            const key = normalizeIngredientName(ingredient.name);
            if (!key || map.has(key)) return;
            map.set(key, {
              name: ingredient.name,
              amount: ingredient.amount || "—",
              price: typeof ingredient.price === "number" ? ingredient.price : 0,
            });
          });
        });
      });
      return Array.from(map.values());
    } catch {
      return [];
    }
  };

  const ingredientMatches = (shoppingName: string, scannedName: string) => {
    const shopping = normalizeIngredientName(shoppingName);
    const scanned = normalizeIngredientName(scannedName);
    if (!shopping || !scanned) return false;
    if (shopping.includes(scanned) || scanned.includes(shopping)) return true;
    return shopping
      .split(" ")
      .some((word) =>
        word.length > 3 &&
        scanned.split(" ").some((scannedWord) => scannedWord.length > 3 && (word.includes(scannedWord) || scannedWord.includes(word))),
      );
  };

  const applyScannedIngredientsToShoppingList = (nextIngredients: string[]) => {
    localStorage.setItem("lastFridgeIngredientList", JSON.stringify(nextIngredients));

    const source = readShoppingSource();
    if (source.length === 0) {
      setMissingIngredients([]);
      notifyFrigyStorageUpdated();
      return;
    }

    const missing = source.filter(
      (item) => !nextIngredients.some((ingredient) => ingredientMatches(item.name, ingredient)),
    );

    setMissingIngredients(missing);
    localStorage.setItem("weeklyShoppingList", JSON.stringify(missing));
    localStorage.removeItem(SHOPPING_CHECKED_NAMES_KEY);
    notifyFrigyStorageUpdated();
  };

  const filterToWeeklyPlanRelevantIngredients = (recognized: string[]) => {
    const cleaned = recognized.map((item) => item.trim()).filter(Boolean);
    const source = readShoppingSource();
    if (source.length === 0) {
      return Array.from(new Set(cleaned));
    }

    const relevant = source
      .filter((item) => cleaned.some((ingredient) => ingredientMatches(item.name, ingredient)))
      .map((item) => item.name.trim())
      .filter(Boolean);

    return Array.from(new Set(relevant));
  };

  const mergeRecognizedIngredients = (recognized: string[], replace: boolean) => {
    const relevantRecognized = filterToWeeklyPlanRelevantIngredients(recognized);
    const base = replace ? [] : ingredients;
    const merged = Array.from(new Set([...base, ...relevantRecognized]));
    setIngredients(merged);
    applyScannedIngredientsToShoppingList(merged);
    return merged;
  };

  const analyzePhotoQueue = async (explicitFiles?: File[]) => {
    const files = explicitFiles?.length ? explicitFiles : [...photoQueueRef.current];
    photoQueueRef.current = [];
    if (files.length === 0) return;

    const replaceResults = captureMode && ingredients.length === 0;
    setAnalysisErrorMessage(null);
    setCaptureMode(false);
    setAnalyzing(true);
    setScanProgress(12);

    const progressInterval = window.setInterval(() => {
      setScanProgress((prev) => (prev < 88 ? prev + Math.random() * 6 + 2 : prev + 0.5));
    }, 280);

    const batchIngredients: string[] = [];
    let processed = 0;
    try {
    for (const file of files) {
    const fileSizeValidation = validateImageFileSize(file.size);
    if (!fileSizeValidation.valid) {
      toast({
        title: "Datei zu groß",
        description: fileSizeValidation.error || VALIDATION_RULES.IMAGE_FILE_SIZE.message,
        variant: "destructive",
      });
          continue;
        }

        const base64 = await fileToBase64(file);
    const qualityCheck = await checkImageQuality(base64);
    if (!qualityCheck.isGoodQuality) {
      toast({
        title: qualityCheck.message,
        description: qualityCheck.suggestion,
        variant: "destructive",
      });
          continue;
    }

    const cachedResult = getCached(base64);
        if (cachedResult?.ingredients) {
          batchIngredients.push(...cachedResult.ingredients);
          processed += 1;
          setScanProgress(12 + (processed / files.length) * 78);
          continue;
        }

        try {
          const { data, error } = await invokeAnalyzeIngredientsWithTimeout({
            image: base64,
            isOnboarding: false,
          });

          if (error) throw error;

          if (data?.error === "scan_limit_exceeded" || data?.error === "premium_required") {
        toast({
          title: t.error,
              description: data?.message || t.premiumRequired || t.couldNotAnalyze,
          variant: "destructive",
        });
            break;
      }

      setCached(base64, data);
          batchIngredients.push(...(data.ingredients || []));
        } catch (scanError) {
          console.error("[ScanPage] analyze-ingredients failed:", scanError);
          const isTimeout =
            scanError instanceof Error && scanError.message === "analyze_ingredients_timeout";
          toast({
            title: t.error,
            description:
              isTimeout
                ? language === "de"
                  ? "Analyse hat zu lange gedauert. Bitte erneut versuchen."
                  : language === "fr"
                    ? "L'analyse a pris trop de temps. Réessaie."
                    : "Analysis took too long. Please try again."
                : language === "de"
                  ? "Die KI-Analyse ist fehlgeschlagen. Bitte erneut versuchen oder ein klareres Foto nutzen."
                  : language === "fr"
                    ? "L'analyse IA a échoué. Réessaie ou utilise une photo plus nette."
                    : "AI analysis failed. Please try again or use a clearer photo.",
            variant: "destructive",
          });
        }

        processed += 1;
        setScanProgress(12 + (processed / files.length) * 78);
      }

      if (batchIngredients.length > 0) {
        mergeRecognizedIngredients(batchIngredients, replaceResults);
        toast({
          title: t.ingredientsRecognized,
          description: `${files.length} Foto${files.length > 1 ? "s" : ""} analysiert.`,
        });
      } else {
        setAnalysisErrorMessage(t.ingredientsNotRecognizedHint);
      }
    } finally {
      window.clearInterval(progressInterval);
      setScanProgress(100);
        setAnalyzing(false);
        setScanProgress(0);
    }
  };

  const exitScan = (didRecognizeIngredients: boolean) => {
    if (scanNav.returnToOnboarding) {
      navigate("/", {
        replace: true,
        state: {
          returnToOnboarding: true,
          showScanFeedback: didRecognizeIngredients,
          onboardingStep: scanNav.nextOnboardingStep ?? "shopping-list",
        },
      });
      return;
    }
    if (didRecognizeIngredients) {
      navigate("/meal-plans?tab=shopping");
      return;
    }
    navigate("/");
  };

  const finishScanResult = () => {
    applyScannedIngredientsToShoppingList(ingredients);
    exitScan(ingredients.length > 0);
  };

  return (
    <FrigyIngredientScanFlow
      ingredients={ingredients}
      missingIngredients={missingIngredients}
      analyzing={analyzing}
      analysisErrorMessage={analysisErrorMessage}
      scanProgress={scanProgress}
      captureMode={captureMode}
      onQueueChange={(files) => {
        photoQueueRef.current = files;
      }}
      onConfirmAnalyze={(files) => void analyzePhotoQueue(files)}
      onClose={() => {
        setAnalysisErrorMessage(null);
        exitScan(ingredients.length > 0);
      }}
      onCreateShoppingList={finishScanResult}
      onAddMorePhotos={() => {
        setAnalysisErrorMessage(null);
        setCaptureMode(true);
      }}
      onRetryAfterError={() => {
        setAnalysisErrorMessage(null);
        setCaptureMode(true);
      }}
      labels={{
        analyzingTitle: t.ingredientScanAnalyzingTitle,
        analyzingSubtitle: t.aiAnalyzingIngredients,
        present: t.ingredientsPresentLabel,
        missing: t.ingredientsMissingLabel,
        createList: t.createShoppingListBtn,
        addPhoto: t.addPhotoBtn,
        finishScan: t.finishScanAnalyzeBtn,
        tapShutter: t.ingredientScanTapShutter,
        errorTitle: t.frigySays,
        errorAction: t.ingredientScanRetryAction,
      }}
    />
  );
};

export default ScanPage;
