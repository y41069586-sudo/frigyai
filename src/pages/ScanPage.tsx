import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { OnboardingStep } from "@/components/onboarding/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, formatTranslation } from "@/contexts/LanguageContext";
import { useAICache } from "@/hooks/useAICache";
import { checkImageQuality } from "@/utils/imageQualityCheck";
import { validateImageFileSize, VALIDATION_RULES } from "@/utils/validation";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import { SHOPPING_CHECKED_NAMES_KEY } from "@/lib/shoppingSync";
import { FrigyIngredientScanFlow } from "@/components/scan/FrigyIngredientScanFlow";
import { usePremiumGate } from "@/contexts/PremiumGateContext";
import { fileToCompressedBase64 } from "@/lib/compressImage";
import { canonicalizeIngredientLabel, dedupeIngredientLabels } from "@/lib/ingredientLabels";
import { splitIngredientsByFridgeCoverage, type DayPlanLike } from "@/lib/shoppingGap";

interface ScanShoppingItem {
  name: string;
  amount: string;
  price: number;
}

const fileToDataUrl = async (file: File): Promise<string | null> => {
  const compressed = await fileToCompressedBase64(file);
  if (compressed) return compressed;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

const ANALYZE_INGREDIENTS_TIMEOUT_MS = 70_000;

type ScanNavState = {
  fromOnboarding?: boolean;
  returnToOnboarding?: boolean;
  nextOnboardingStep?: OnboardingStep;
};

async function invokeAnalyzeIngredientsWithTimeout(body: {
  image: string;
  isOnboarding: boolean;
  knownIngredients?: string[];
}) {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("analyze_ingredients_timeout"));
    }, ANALYZE_INGREDIENTS_TIMEOUT_MS);
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  return Promise.race([
    supabase.functions.invoke("analyze-ingredients", { body, headers }),
    timeoutPromise,
  ]) as Promise<{ data: { error?: string; message?: string; ingredients?: string[] } | null; error: unknown }>;
}

const ScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ensurePremium } = usePremiumGate();
  const scanNav = (location.state ?? {}) as ScanNavState;
  const { toast } = useToast();
  const { t } = useLanguage();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<ScanShoppingItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhotoIndex, setScanPhotoIndex] = useState(0);
  const [scanPhotoTotal, setScanPhotoTotal] = useState(0);
  const [scanAnalyzingPreviewUrl, setScanAnalyzingPreviewUrl] = useState<string | null>(null);
  const photoQueueRef = useRef<File[]>([]);
  const analyzeLockRef = useRef(false);

  const isOnboardingScan = Boolean(scanNav.returnToOnboarding || scanNav.fromOnboarding);

  const { getCached, setCached } = useAICache();

  const readMealPlanFromStorage = (): DayPlanLike[] => {
    try {
      const rawPlan = localStorage.getItem("weeklyMealPlan");
      const plan = rawPlan ? JSON.parse(rawPlan) : [];
      return Array.isArray(plan) ? (plan as DayPlanLike[]) : [];
    } catch {
      return [];
    }
  };

  const applyScannedIngredientsToShoppingList = (nextIngredients: string[]) => {
    localStorage.setItem("lastFridgeIngredientList", JSON.stringify(nextIngredients));

    const plan = readMealPlanFromStorage();
    if (plan.length === 0) {
      setIngredients(dedupeIngredientLabels(nextIngredients));
      setMissingIngredients([]);
      notifyFrigyStorageUpdated();
      return;
    }

    const { present, missing } = splitIngredientsByFridgeCoverage(plan, nextIngredients);
    setIngredients(present);
    setMissingIngredients(missing);
    localStorage.setItem("weeklyShoppingList", JSON.stringify(missing));
    localStorage.removeItem(SHOPPING_CHECKED_NAMES_KEY);
    notifyFrigyStorageUpdated();
  };


  const analyzePhotoQueue = async (explicitFiles?: File[]) => {
    if (analyzeLockRef.current) return;

    if (!isOnboardingScan && !(await ensurePremium())) return;

    const files = explicitFiles?.length ? explicitFiles : [...photoQueueRef.current];
    photoQueueRef.current = [];
    if (files.length === 0) return;

    analyzeLockRef.current = true;
    const replaceResults = captureMode && ingredients.length === 0;
    setAnalysisErrorMessage(null);
    setCaptureMode(false);
    setAnalyzing(true);
    setScanProgress(8);

    const progressInterval = window.setInterval(() => {
      setScanProgress((prev) => (prev < 92 ? prev + Math.random() * 4 + 1 : prev + 0.3));
    }, 320);

    let mergedSoFar = replaceResults ? [] : [...ingredients];
    let analyzedCount = 0;
    let failedCount = 0;

    try {
      type PreparedPhoto = { file: File; dataUrl: string };
      const prepared: PreparedPhoto[] = [];

      for (const file of files) {
        const fileSizeValidation = validateImageFileSize(file.size);
        if (!fileSizeValidation.valid) {
          failedCount += 1;
          toast({
            title: t.scanFileTooLarge,
            description: fileSizeValidation.error || VALIDATION_RULES.IMAGE_FILE_SIZE.message,
            variant: "destructive",
          });
          continue;
        }

        const dataUrl = await fileToDataUrl(file);
        if (!dataUrl) {
          failedCount += 1;
          toast({
            title: t.error,
            description: t.scanPhotoReadError,
            variant: "destructive",
          });
          continue;
        }

        prepared.push({ file, dataUrl });
      }

      if (prepared.length === 0) {
        setAnalysisErrorMessage(t.ingredientsNotRecognizedHint);
        return;
      }

      setScanPhotoTotal(prepared.length);
      setScanPhotoIndex(0);

      for (let i = 0; i < prepared.length; i += 1) {
        const { dataUrl } = prepared[i];
        const photoNumber = i + 1;

        setScanPhotoIndex(photoNumber);
        setScanAnalyzingPreviewUrl(dataUrl);
        setScanProgress(8 + ((photoNumber - 1) / prepared.length) * 82);

        const qualityCheck = await checkImageQuality(dataUrl);
        if (!qualityCheck.isGoodQuality) {
          failedCount += 1;
          toast({
            title: qualityCheck.message,
            description: qualityCheck.suggestion,
            variant: "destructive",
          });
          continue;
        }

        const cachedResult = getCached(dataUrl);
        const cachedIngredients =
          cachedResult &&
          Array.isArray((cachedResult as { ingredients?: string[] }).ingredients)
            ? ((cachedResult as { ingredients: string[] }).ingredients)
            : null;

        let found: string[] = [];

        if (cachedIngredients) {
          found = cachedIngredients;
        } else {
          try {
            const { data, error } = await invokeAnalyzeIngredientsWithTimeout({
              image: dataUrl,
              isOnboarding: isOnboardingScan,
              knownIngredients: mergedSoFar,
            });

            if (error) throw error;

            if (data?.error === "scan_limit_exceeded" || data?.error === "premium_required") {
              await ensurePremium();
              break;
            }

            setCached(dataUrl, data ?? { ingredients: [] });
            found = data?.ingredients ?? [];
          } catch (scanError) {
            failedCount += 1;
            console.error("[ScanPage] analyze-ingredients failed:", scanError);
            const isTimeout =
              scanError instanceof Error && scanError.message === "analyze_ingredients_timeout";
            toast({
              title: t.error,
              description: isTimeout
                ? formatTranslation(t.scanPhotoTimeoutContinue, { n: photoNumber })
                : formatTranslation(t.scanPhotoFailedContinue, { n: photoNumber }),
              variant: "destructive",
            });
            continue;
          }
        }

        analyzedCount += 1;
        if (found.length > 0) {
          mergedSoFar = dedupeIngredientLabels([
            ...mergedSoFar,
            ...found.map((item) => canonicalizeIngredientLabel(item.trim())).filter(Boolean),
          ]);
          setIngredients(mergedSoFar);
          applyScannedIngredientsToShoppingList(mergedSoFar);
        }

        setScanProgress(8 + (photoNumber / prepared.length) * 82);
      }

      if (mergedSoFar.length > 0) {
        toast({
          title: t.ingredientsRecognized,
          description:
            formatTranslation(t.scanPhotosAnalyzedSummary, {
              analyzed: analyzedCount,
              total: prepared.length,
            }) + (failedCount > 0 ? formatTranslation(t.scanPhotosSkippedSuffix, { skipped: failedCount }) : ""),
        });
      } else if (analyzedCount === 0 && failedCount > 0) {
        setAnalysisErrorMessage(t.ingredientsNotRecognizedHint);
      } else if (analyzedCount > 0) {
        setAnalysisErrorMessage(t.ingredientsNotRecognizedHint);
      } else {
        setAnalysisErrorMessage(t.ingredientsNotRecognizedHint);
      }
    } finally {
      window.clearInterval(progressInterval);
      setScanProgress(100);
      setAnalyzing(false);
      setScanProgress(0);
      setScanPhotoIndex(0);
      setScanPhotoTotal(0);
      setScanAnalyzingPreviewUrl(null);
      analyzeLockRef.current = false;
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
      scanPhotoIndex={scanPhotoIndex}
      scanPhotoTotal={scanPhotoTotal}
      analyzingPreviewUrl={scanAnalyzingPreviewUrl}
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
