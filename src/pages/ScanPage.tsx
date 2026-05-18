import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, ArrowLeft, Camera, Clock, ChefHat, Check, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAICache } from "@/hooks/useAICache";
import { checkImageQuality, ImageQualityResult } from "@/utils/imageQualityCheck";
import { validateImageFileSize, VALIDATION_RULES } from "@/utils/validation";
import { analyzeImage as analyzeImageMock } from "@/lib/food-ai/mock";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import { SHOPPING_CHECKED_NAMES_KEY } from "@/lib/shoppingSync";

interface RecentDish {
  id: string;
  title: string;
  prepTime: number;
  calories: number;
  date: string;
}

interface ScanShoppingItem {
  name: string;
  amount: string;
  price: number;
}

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<ScanShoppingItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<File[] | null>(null);
  const [recentDishes, setRecentDishes] = useState<RecentDish[]>([]);
  const [imageQualityIssue, setImageQualityIssue] = useState<ImageQualityResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const { getCached, setCached, cacheHits } = useAICache();

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
      /* fall through to meal plan */
    }

    try {
      const rawPlan = localStorage.getItem("weeklyMealPlan");
      const plan = rawPlan ? JSON.parse(rawPlan) : [];
      if (!Array.isArray(plan)) return [];

      const map = new Map<string, ScanShoppingItem>();
      plan.forEach((day: any) => {
        day.meals?.forEach((meal: any) => {
          meal.ingredients?.forEach((ingredient: ScanShoppingItem) => {
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

  const resetScanResult = () => {
    setImagePreview(null);
    setIngredients([]);
    setMissingIngredients([]);
    localStorage.removeItem("lastFridgeIngredientList");
  };

  const finishScanResult = () => {
    applyScannedIngredientsToShoppingList(ingredients);
    navigate("/meal-plans?tab=shopping");
  };

  // Load recent dishes on mount
  useEffect(() => {
    // Load recent dishes from localStorage
    const loadRecentDishes = () => {
      try {
        const stored = localStorage.getItem('recentDishes');
        if (stored) {
          const dishes = JSON.parse(stored) as RecentDish[];
          setRecentDishes(dishes.slice(0, 5)); // Show max 5 recent dishes
        }
      } catch (e) {
        console.error('Error loading recent dishes:', e);
      }
    };

    loadRecentDishes();
  }, []);

  const mergeIngredients = (nextIngredients: string[]) => {
    let currentIngredients = ingredients;
    try {
      const raw = localStorage.getItem("lastFridgeIngredientList");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) currentIngredients = parsed;
    } catch {
      currentIngredients = ingredients;
    }

    const merged = Array.from(
      new Set([
        ...currentIngredients,
        ...nextIngredients.map((item) => item.trim()).filter(Boolean),
      ]),
    );
    setIngredients(merged);
    applyScannedIngredientsToShoppingList(merged);
    return merged;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    // Check if permissions have been granted (mocked one-time request)
    const hasGrantedPermissions = localStorage.getItem('frig_scan_permissions_granted');
    if (!hasGrantedPermissions) {
      setPendingUpload(files);
      setShowPermissionRequest(true);
      return;
    }

    await processImageUploads(files);
  };

  const confirmPermissions = async () => {
    localStorage.setItem('frig_scan_permissions_granted', 'true');
    setShowPermissionRequest(false);
    if (pendingUpload) {
      await processImageUploads(pendingUpload);
      setPendingUpload(null);
    }
  };

  const processImageUploads = async (files: File[]) => {
    if (files.length > 1) {
      setIngredients([]);
      setMissingIngredients([]);
      localStorage.removeItem("lastFridgeIngredientList");
    }

    for (const file of files) {
      await processImageUpload(file, files.length > 1);
    }

    if (files.length > 1) {
      toast({
        title: t.ingredientsRecognized,
        description: `${files.length} Fotos analysiert: Speisekammer, Kühlschrank oder Schränke können kombiniert werden.`,
      });
    }
  };

  const processImageUpload = async (file: File, append = false) => {
    // Validate file size before processing
    const fileSizeValidation = validateImageFileSize(file.size);
    if (!fileSizeValidation.valid) {
      toast({
        title: "Datei zu groß",
        description: fileSizeValidation.error || VALIDATION_RULES.IMAGE_FILE_SIZE.message,
        variant: "destructive",
      });
      return;
    }

    // Reset quality issue
    setImageQualityIssue(null);

    // Convert image to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // Create preview
    setImagePreview(base64);

    // Check image quality before proceeding
    const qualityCheck = await checkImageQuality(base64);
    if (!qualityCheck.isGoodQuality) {
      setImageQualityIssue(qualityCheck);
      toast({
        title: qualityCheck.message,
        description: qualityCheck.suggestion,
        variant: "destructive",
      });
      return;
    }

    // Check cache first - save API costs!
    const cachedResult = getCached(base64);
    if (cachedResult) {
      console.log('[SCAN] Using cached result');
      const cachedIngredients = cachedResult.ingredients || [];
      if (append) {
        mergeIngredients(cachedIngredients);
      } else {
        setIngredients(cachedIngredients);
        applyScannedIngredientsToShoppingList(cachedIngredients);
      }
      
      toast({
        title: t.ingredientsRecognized,
        description: `${cachedResult.ingredients?.length || 0} ${t.ingredientsFound}. (aus Cache)`,
      });
      return;
    }

    setAnalyzing(true);
    setScanProgress(0);

    // Simulate progress animation during scan
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        // Slowly increase, but never reach 100% until actual completion
        if (prev < 85) {
          return prev + Math.random() * 8 + 2;
        }
        return prev + Math.random() * 1;
      });
    }, 300);

    try {
      // Call edge function to analyze image
      const { data, error } = await supabase.functions.invoke(
        "analyze-ingredients",
        {
          body: { 
            image: base64,
            isOnboarding: false 
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.error === "scan_limit_exceeded") {
        toast({
          title: t.error,
          description: t.couldNotAnalyze,
          variant: "destructive",
        });
        setImagePreview(null);
        return;
      }

      // Cache the result for future use
      setCached(base64, data);

      const recognizedIngredients = data.ingredients || [];
      if (append) {
        mergeIngredients(recognizedIngredients);
      } else {
        setIngredients(recognizedIngredients);
        applyScannedIngredientsToShoppingList(recognizedIngredients);
      }
      
      toast({
        title: t.ingredientsRecognized,
        description: `${data.ingredients?.length || 0} ${t.ingredientsFound}.`,
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      try {
        const mockIngs = await analyzeImageMock(file);
        if (append) {
          mergeIngredients(mockIngs);
        } else {
          setIngredients(mockIngs);
          applyScannedIngredientsToShoppingList(mockIngs);
        }
        toast({
          title: "Demo-Analyse",
          description: "Zutaten simuliert (API nicht erreichbar).",
        });
      } catch {
        toast({
          title: t.error,
          description: t.couldNotAnalyze,
          variant: "destructive",
        });
      }
    } finally {
      clearInterval(progressInterval);
      setScanProgress(100);
      setTimeout(() => {
        setAnalyzing(false);
        setScanProgress(0);
      }, 300);
    }
  };

  // language and t already destructured at line 27

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t.todayLabel;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t.yesterdayLabel;
    } else {
      return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-2.5 min-[360px]:px-3 sm:px-4 py-4 sm:py-8 safe-bottom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between mb-4 sm:mb-8 gap-2"
        >
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-2 sm:mr-4 shrink-0 touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg min-[360px]:text-xl sm:text-3xl font-bold truncate">
              {t.scanTitle.split(' ')[0]} <span className="text-neon">{t.scanTitle.split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>

        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Image Quality Warning - Friendly message for dark/bright images */}
          {imageQualityIssue && !imageQualityIssue.isGoodQuality && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <div className="flex items-start gap-3">
                {imageQualityIssue.issue === 'too_dark' ? (
                  <Moon className="h-6 w-6 text-amber-500 mt-0.5" />
                ) : (
                  <Sun className="h-6 w-6 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                    {imageQualityIssue.message}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {imageQualityIssue.suggestion}
                  </p>
                  <Button
                    onClick={() => {
                      setImagePreview(null);
                      setImageQualityIssue(null);
                      document.getElementById("cameraInput")?.click();
                    }}
                    className="mt-3"
                    variant="outline"
                    size="sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Neues Foto machen
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Area */}
          {!imagePreview ? (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-2 border-dashed rounded-2xl sm:rounded-3xl p-4 min-[360px]:p-6 sm:p-12 text-center transition-all bg-card border-primary/50"
              >
                <Upload className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-primary" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                  Zutaten erkennen
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                  Scanne Speisekammer, Kühlschrank oder Schränke. Du kannst mehrere Fotos auswählen und gemeinsam analysieren.
                </p>
                
                {/* Two buttons: Camera and Gallery */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
                  {/* Camera Button */}
                  <Button 
                    className="gradient-neon text-black font-semibold glow-button touch-target flex-1 sm:flex-none text-xs min-[360px]:text-sm"
                    onClick={() => {
                      document.getElementById("cameraInput")?.click();
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {language === 'de' ? 'Foto aufnehmen' : language === 'fr' ? 'Prendre une photo' : 'Take Photo'}
                  </Button>
                  
                  {/* Gallery Button */}
                  <Button 
                    variant="outline"
                    className="touch-target flex-1 sm:flex-none text-xs min-[360px]:text-sm"
                    onClick={() => {
                      document.getElementById("galleryInput")?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {language === 'de' ? 'Mehrere Fotos wählen' : language === 'fr' ? 'Choisir plusieurs photos' : 'Choose multiple photos'}
                  </Button>
                </div>
                
                {/* Hidden Camera Input - opens camera directly */}
                <input
                  id="cameraInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {/* Hidden Gallery Input - opens photo library */}
                <input
                  id="galleryInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </motion.div>

              {/* Recent Dishes History */}
              {recentDishes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    {t.recentlyCooked}
                  </h3>
                  <div className="space-y-3">
                    {recentDishes.map((dish, index) => (
                      <motion.div
                        key={dish.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Card className="p-4 bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                              <ChefHat className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{dish.title}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{dish.prepTime} {t.min}</span>
                                <span>•</span>
                                <span>{dish.calories} kcal</span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDate(dish.date)}
                            </span>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Image Preview with dark overlay during analysis */}
              <div className="rounded-3xl overflow-hidden shadow-2xl relative">
                {analyzing ? (
                  <>
                    <img
                      src={imagePreview}
                      alt={t.scanFridge}
                      className="w-full h-auto blur-[2px]"
                    />
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 min-[360px]:p-6">
                      {/* Scanning line - smooth 60fps */}
                      <motion.div
                        className="absolute left-0 right-0 h-0.5"
                        style={{
                          background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
                          willChange: "transform",
                        }}
                        initial={{ top: "10%" }}
                        animate={{ top: ["10%", "90%", "10%"] }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Modern center content */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-4 min-[360px]:gap-6"
                      >
                        {/* Icon with subtle glow */}
                        <div className="relative">
                          <div 
                            className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" 
                            style={{ transform: "scale(2)" }}
                          />
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-14 h-14 min-[360px]:w-16 min-[360px]:h-16 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30"
                          >
                            <Camera className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 text-primary" />
                          </motion.div>
                        </div>
                        
                        {/* Text */}
                        <div className="text-center">
                          <p className="text-base min-[360px]:text-lg font-semibold text-white">
                            {t.analyzingFridge}
                          </p>
                          <p className="text-xs min-[360px]:text-sm text-white/60 mt-1">
                            {t.aiAnalyzingIngredients}
                          </p>
                        </div>
                        
                        {/* Progress bar - wider, cleaner */}
                        <div className="w-full max-w-[14rem]">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ 
                                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
                                willChange: "width",
                              }}
                              initial={{ width: "0%" }}
                              animate={{ width: `${Math.min(scanProgress, 100)}%` }}
                              transition={{ duration: 0.2, ease: "linear" }}
                            />
                          </div>
                          {/* Percentage below bar */}
                          <p className="text-center text-white/80 text-xs min-[360px]:text-sm font-medium mt-2">
                            {Math.round(Math.min(scanProgress, 100))}%
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <img
                    src={imagePreview}
                    alt={t.scanFridge}
                    className="w-full h-auto"
                  />
                )}
              </div>

              {!analyzing && (
                <motion.div
                  key="ingredients"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className="p-4 bg-card/90 border-primary/20">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-base font-bold">Vorhandene Zutaten</h2>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {ingredients.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="inline-flex items-center gap-1 rounded-full bg-green-500/12 px-3 py-1.5 text-sm font-medium text-green-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-card/90 border-amber-500/20">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-base font-bold">Fehlende Zutaten</h2>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                        {missingIngredients.length}
                      </span>
                    </div>
                    {missingIngredients.length > 0 ? (
                      <div className="space-y-2">
                        {missingIngredients.map((item) => (
                          <div
                            key={`${item.name}-${item.amount}`}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/8 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0 font-medium">{item.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Keine fehlenden Zutaten erkannt.
                      </p>
                    )}
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      className="h-12 rounded-2xl bg-primary text-primary-foreground"
                      onClick={finishScanResult}
                    >
                      Fertig
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-2xl"
                      onClick={resetScanResult}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Neues Foto
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Permission Request Dialog */}
      <Dialog open={showPermissionRequest} onOpenChange={setShowPermissionRequest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {language === 'de' ? 'Kamera & Galerie Zugriff' : 'Camera & Gallery Access'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'de'
                ? 'Um deinen Kühlschrank scannen zu können, benötigt Frigy Zugriff auf deine Kamera oder deine Fotogalerie. Deine Bilder werden nur zur Analyse verwendet.'
                : 'To scan your fridge, Frigy needs access to your camera or photo gallery. Your images are only used for analysis.'}
            </p>
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {language === 'de'
                  ? 'Wir speichern keine privaten Fotos dauerhaft ohne Grund.'
                  : 'We do not store private photos permanently without reason.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowPermissionRequest(false);
              setPendingUpload(null);
            }}>
              {t.cancel}
            </Button>
            <Button className="flex-1" onClick={confirmPermissions}>
              {language === 'de' ? 'Zulassen' : 'Allow'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScanPage;
