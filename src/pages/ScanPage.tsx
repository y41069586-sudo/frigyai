import { useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<ScanShoppingItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const photoQueueRef = useRef<File[]>([]);
  const pendingPermissionAction = useRef<"analyze" | null>(null);

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

  const ensureScanPermissions = (): boolean => {
    if (localStorage.getItem("frig_scan_permissions_granted")) return true;
    setShowPermissionRequest(true);
    return false;
  };

  const analyzePhotoQueue = async () => {
    const files = [...photoQueueRef.current];
    photoQueueRef.current = [];
    if (files.length === 0) return;

    const replaceResults = captureMode && ingredients.length === 0;
    setAnalysisErrorMessage(null);
    setCaptureMode(false);
    setAnalyzing(true);
    setScanProgress(8);

    const progressInterval = setInterval(() => {
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
          const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
            body: { image: base64, isOnboarding: false },
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
          toast({
            title: t.error,
            description:
              language === "de"
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
        setAnalysisErrorMessage(
          language === "de"
            ? "Hmm, ich konnte keine Zutaten erkennen. Versuchen wir es nochmal mit einem klareren Foto, okay?"
            : language === "fr"
              ? "Hmm, je n'ai pas reussi a reconnaitre les ingredients. On reessaie avec une photo plus nette ?"
              : "Hmm, I could not recognize any ingredients. Let's try again with a clearer photo, okay?",
        );
      }
    } finally {
      clearInterval(progressInterval);
      setScanProgress(100);
      setTimeout(() => {
        setAnalyzing(false);
        setScanProgress(0);
      }, 320);
    }
  };

  const handleConfirmAnalyze = async () => {
    if (!ensureScanPermissions()) {
      pendingPermissionAction.current = "analyze";
      return;
    }
    await analyzePhotoQueue();
  };

  const handleAddPhotos = (files: File[]) => {
    if (!localStorage.getItem("frig_scan_permissions_granted")) {
      photoQueueRef.current = [...photoQueueRef.current, ...files];
      pendingPermissionAction.current = "analyze";
      setShowPermissionRequest(true);
    }
  };

  const confirmPermissions = async () => {
    localStorage.setItem("frig_scan_permissions_granted", "true");
    setShowPermissionRequest(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      toast({
        title: "Kamera-Zugriff",
        description: "Bitte Kamera in den Geräteeinstellungen für Frigy erlauben.",
        variant: "destructive",
      });
    }

    if (pendingPermissionAction.current === "analyze" && photoQueueRef.current.length > 0) {
      pendingPermissionAction.current = null;
      await analyzePhotoQueue();
    }
    pendingPermissionAction.current = null;
  };

  const finishScanResult = () => {
    applyScannedIngredientsToShoppingList(ingredients);
    navigate("/meal-plans?tab=shopping");
  };

  return (
    <>
      <FrigyIngredientScanFlow
        ingredients={ingredients}
        missingIngredients={missingIngredients}
        analyzing={analyzing}
        analysisErrorMessage={analysisErrorMessage}
        scanProgress={scanProgress}
        captureMode={captureMode}
        onAddPhotos={handleAddPhotos}
        onQueueChange={(files) => {
          photoQueueRef.current = files;
        }}
        onConfirmAnalyze={() => void handleConfirmAnalyze()}
        onClose={() => {
          setAnalysisErrorMessage(null);
          navigate("/");
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
          analyzingTitle: language === "de" ? "Zutaten werden gescannt." : language === "fr" ? "Les ingredients sont scannes." : "Ingredients are being scanned.",
          analyzingSubtitle: t.aiAnalyzingIngredients ?? "Frigy erkennt deine Vorräte…",
          present: "Vorhanden",
          missing: "Fehlend",
          createList: "Einkaufsliste erstellen",
          addPhoto: "Foto hinzufügen",
          finishScan: "Fertig – analysieren",
          tapShutter: "Frigy-Kamera: unten aufnehmen, rechts Galerie",
          errorTitle: "Frigy sagt",
          errorAction: language === "de" ? "Zutaten nochmal scannen" : language === "fr" ? "Scanner encore" : "Scan again",
        }}
      />

      <Dialog open={showPermissionRequest} onOpenChange={setShowPermissionRequest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {language === "de" ? "Kamera & Galerie Zugriff" : "Camera & Gallery Access"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "de"
                ? "Um Zutaten zu erkennen, benötigt Frigy Zugriff auf Kamera oder Galerie. Fotos werden nur zur Analyse genutzt."
                : "Frigy needs camera or gallery access to recognize ingredients. Photos are only used for analysis."}
            </p>
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {language === "de"
                  ? "Mehrere Fotos kannst du sammeln und erst mit „Fertig“ gemeinsam analysieren."
                  : "Collect multiple photos and analyze them together when you tap Done."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
              setShowPermissionRequest(false);
                pendingPermissionAction.current = null;
              }}
            >
              {t.cancel}
            </Button>
            <Button className="flex-1" onClick={() => void confirmPermissions()}>
              {language === "de" ? "Zulassen" : "Allow"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScanPage;
