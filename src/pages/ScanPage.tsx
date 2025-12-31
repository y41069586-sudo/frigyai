import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, ArrowLeft, Camera, Crown, AlertCircle, Clock, ChefHat, ShoppingCart, Check, Sun, Moon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import IngredientsList from "@/components/IngredientsList";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import CookingPrefsSelector from "@/components/CookingPrefsSelector";
import { Card } from "@/components/ui/card";
import { useShoppingListSync } from "@/hooks/useShoppingListSync";
import { useAICache } from "@/hooks/useAICache";
import { checkImageQuality, ImageQualityResult } from "@/utils/imageQualityCheck";

const FREE_SCAN_LIMIT = 2;

interface RecentDish {
  id: string;
  title: string;
  prepTime: number;
  calories: number;
  date: string;
}

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, subscriptionStatus, isFreeMode, isPremium } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [showPrefsSelector, setShowPrefsSelector] = useState(false);
  const [recentDishes, setRecentDishes] = useState<RecentDish[]>([]);
  const [syncedItems, setSyncedItems] = useState<string[]>([]);
  const [imageQualityIssue, setImageQualityIssue] = useState<ImageQualityResult | null>(null);

  const { syncWithScannedIngredients } = useShoppingListSync();
  const { getCached, setCached, cacheHits } = useAICache();

  const isSubscribed = subscriptionStatus?.subscribed;
  
  // Check if user is in onboarding mode (free trial scan)
  const isOnboardingMode = !localStorage.getItem('onboardingComplete') || 
    localStorage.getItem('onboardingScanUsed') !== 'true';

  // Load scan usage and recent dishes on mount
  useEffect(() => {
    const loadScanUsage = async () => {
      if (!user || isSubscribed) {
        setScansRemaining(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', user.id)
        .eq('scan_date', today)
        .single();

      const usedScans = data?.scan_count || 0;
      setScansRemaining(FREE_SCAN_LIMIT - usedScans);
      setScanLimitReached(usedScans >= FREE_SCAN_LIMIT);
    };

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

    loadScanUsage();
    loadRecentDishes();
  }, [user, isSubscribed]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset quality issue
    setImageQualityIssue(null);

    // Allow onboarding users ONE free scan
    const canScanAsOnboarding = isOnboardingMode && !user;
    
    // Free mode users cannot scan - redirect to paywall (unless onboarding)
    if (isFreeMode && !canScanAsOnboarding) {
      toast({
        title: "Premium Feature",
        description: "Kühlschrank-Scan ist nur für Premium-Nutzer verfügbar",
        variant: "destructive",
      });
      navigate('/premium-pricing');
      return;
    }

    // Check scan limit for logged-in free users (not onboarding)
    if (!canScanAsOnboarding && !isSubscribed && scansRemaining !== null && scansRemaining <= 0) {
      setScanLimitReached(true);
      toast({
        title: t.scanLimitReached,
        description: t.upgradeToPremium,
        variant: "destructive",
      });
      return;
    }

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
      setIngredients(cachedResult.ingredients || []);
      
      if (cachedResult.ingredients && cachedResult.ingredients.length > 0) {
        const syncResult = syncWithScannedIngredients(cachedResult.ingredients);
        setSyncedItems(syncResult.matchedItems);
      }
      
      toast({
        title: t.ingredientsRecognized,
        description: `${cachedResult.ingredients?.length || 0} ${t.ingredientsFound}. (aus Cache)`,
      });
      return;
    }

    setUploading(true);
    setAnalyzing(true);

    try {
      // Determine if this is an onboarding scan
      const isOnboardingScan = isOnboardingMode && !user;
      
      // Call edge function to analyze image
      const { data, error } = await supabase.functions.invoke(
        "analyze-ingredients",
        {
          body: { 
            image: base64,
            isOnboarding: isOnboardingScan 
          },
        }
      );
      
      // Mark onboarding scan as used
      if (isOnboardingScan && data?.ingredients?.length > 0) {
        localStorage.setItem('onboardingScanUsed', 'true');
      }

      if (error) {
        // Check for scan limit error
        if (error.message?.includes("429") || data?.error === "scan_limit_exceeded") {
          setScanLimitReached(true);
          setScansRemaining(0);
          toast({
            title: t.scanLimitReached,
            description: t.usedScansToday,
            variant: "destructive",
          });
          setImagePreview(null);
          return;
        }
        throw error;
      }

      // Check for scan limit in response
      if (data?.error === "scan_limit_exceeded") {
        setScanLimitReached(true);
        setScansRemaining(0);
        toast({
          title: t.scanLimitReached,
          description: data.message || t.upgradeToPremium,
          variant: "destructive",
        });
        setImagePreview(null);
        return;
      }

      // Cache the result for future use
      setCached(base64, data);

      setIngredients(data.ingredients || []);
      
      // Sync mit Einkaufsliste
      if (data.ingredients && data.ingredients.length > 0) {
        const syncResult = syncWithScannedIngredients(data.ingredients);
        setSyncedItems(syncResult.matchedItems);
      }
      
      // Update remaining scans
      if (data.scansRemaining !== undefined && data.scansRemaining !== null) {
        setScansRemaining(data.scansRemaining);
      }

      toast({
        title: t.ingredientsRecognized,
        description: `${data.ingredients?.length || 0} ${t.ingredientsFound}.`,
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: t.error,
        description: t.couldNotAnalyze,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleGenerateRecipes = () => {
    setShowPrefsSelector(true);
  };

  const handlePrefsConfirm = (cookingTime: number, mood: 'tired' | 'normal' | 'motivated' | 'stressed') => {
    // Lade aktuelles Makro-Budget aus localStorage
    const storedProfile = localStorage.getItem('userProfile');
    const storedMacros = localStorage.getItem('todayMacros');
    
    let macroBudget = undefined;
    let userProfile = undefined;
    
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        userProfile = {
          goalMode: profile.goalMode,
          age: profile.age,
          weight: profile.weight,
        };
        
        // Berechne restliches Budget
        const todayMacros = storedMacros ? JSON.parse(storedMacros) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
        macroBudget = {
          remainingCalories: Math.max(0, (profile.dailyCalories || 2000) - (todayMacros.calories || 0)),
          remainingProtein: Math.max(0, (profile.dailyProtein || 150) - (todayMacros.protein || 0)),
          remainingCarbs: Math.max(0, (profile.dailyCarbs || 200) - (todayMacros.carbs || 0)),
          remainingFat: Math.max(0, (profile.dailyFat || 70) - (todayMacros.fat || 0)),
        };
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }
    
    navigate("/recipes", { 
      state: { 
        ingredients, 
        cookingTime, 
        mood,
        macroBudget,
        userProfile,
        mealToReplace: 'Mittagessen', // Standard-Mahlzeit
      } 
    });
  };

  // Berechne Makro-Budget für die Anzeige
  const getMacroBudget = () => {
    const storedProfile = localStorage.getItem('userProfile');
    const storedMacros = localStorage.getItem('todayMacros');
    
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        const todayMacros = storedMacros ? JSON.parse(storedMacros) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return {
          remainingCalories: Math.max(0, (profile.dailyCalories || 2000) - (todayMacros.calories || 0)),
          remainingProtein: Math.max(0, (profile.dailyProtein || 150) - (todayMacros.protein || 0)),
          remainingCarbs: Math.max(0, (profile.dailyCarbs || 200) - (todayMacros.carbs || 0)),
          remainingFat: Math.max(0, (profile.dailyFat || 70) - (todayMacros.fat || 0)),
        };
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  };

  const handlePrefsBack = () => {
    setShowPrefsSelector(false);
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 safe-bottom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 sm:mb-8 gap-2"
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
            <h1 className="text-xl sm:text-3xl font-bold truncate">
              {t.scanTitle.split(' ')[0]} <span className="text-neon">{t.scanTitle.split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>

          {/* Scan Counter - only for non-free-mode users */}
          {user && !isSubscribed && !isFreeMode && scansRemaining !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full shrink-0 text-xs sm:text-sm ${
                scansRemaining > 0 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-semibold">
                {scansRemaining}/{FREE_SCAN_LIMIT}
              </span>
            </motion.div>
          )}

          {/* Free mode badge */}
          {isFreeMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-muted text-muted-foreground shrink-0 text-xs sm:text-sm"
            >
              <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-semibold hidden sm:inline">Free Mode</span>
            </motion.div>
          )}

          {isPremium && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-yellow-500/10 text-yellow-500 shrink-0 text-xs sm:text-sm"
            >
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-semibold hidden sm:inline">{t.unlimited}</span>
              <span className="font-semibold sm:hidden">∞</span>
            </motion.div>
          )}
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Scan Limit Warning */}
          {scanLimitReached && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">{t.dailyScanLimitReached}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.usedScansToday}
                  </p>
                  <Button
                    onClick={() => navigate("/premium")}
                    className="mt-3 gradient-neon text-black font-semibold"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {t.upgradeToPremium}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

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
                className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center transition-all bg-card ${
                  scanLimitReached && !isPremium
                    ? 'border-muted cursor-not-allowed opacity-50'
                    : 'border-primary/50'
                }`}
              >
                <Upload className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-primary" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                  {t.uploadPhoto}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                  {t.takePhotoOrSelect}
                </p>
                
                {/* Two buttons: Camera and Gallery */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Camera Button */}
                  <Button 
                    className="gradient-neon text-black font-semibold glow-button touch-target flex-1 sm:flex-none"
                    disabled={scanLimitReached && !isPremium}
                    onClick={() => {
                      if (scanLimitReached && !isPremium) return;
                      document.getElementById("cameraInput")?.click();
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {language === 'de' ? 'Foto aufnehmen' : language === 'fr' ? 'Prendre une photo' : 'Take Photo'}
                  </Button>
                  
                  {/* Gallery Button */}
                  <Button 
                    variant="outline"
                    className="touch-target flex-1 sm:flex-none"
                    disabled={scanLimitReached && !isPremium}
                    onClick={() => {
                      if (scanLimitReached && !isPremium) return;
                      document.getElementById("galleryInput")?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {language === 'de' ? 'Aus Galerie wählen' : language === 'fr' ? 'Choisir de la galerie' : 'Choose from Gallery'}
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
                  disabled={scanLimitReached && !isPremium}
                />
                
                {/* Hidden Gallery Input - opens photo library */}
                <input
                  id="galleryInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={scanLimitReached && !isPremium}
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
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                        <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary relative z-10" />
                      </motion.div>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-semibold text-white text-center px-4"
                      >
                        {t.aiAnalyzingIngredients}
                      </motion.p>
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
                <AnimatePresence mode="wait">
                  {showPrefsSelector ? (
                    <motion.div
                      key="prefs"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <CookingPrefsSelector
                        onConfirm={handlePrefsConfirm}
                        onBack={handlePrefsBack}
                        macroBudget={getMacroBudget()}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ingredients"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Synced Shopping List Items */}
                      {syncedItems.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-green-500/20">
                              <ShoppingCart className="h-4 w-4 text-green-500" />
                            </div>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              Von Einkaufsliste abgehakt
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {syncedItems.map((item, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 text-sm"
                              >
                                <Check className="h-3 w-3" />
                                {item}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Ingredients List */}
                      <IngredientsList
                        ingredients={ingredients}
                        onIngredientsChange={setIngredients}
                      />

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={() => {
                            setImagePreview(null);
                            setIngredients([]);
                            setShowPrefsSelector(false);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          {t.newPhoto}
                        </Button>
                        <Button
                          onClick={handleGenerateRecipes}
                          disabled={ingredients.length === 0}
                          className="flex-1 gradient-neon text-black font-semibold glow-button"
                        >
                          {t.continueButton}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
