import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, ArrowLeft, Camera, Crown, AlertCircle, Clock, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import IngredientsList from "@/components/IngredientsList";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import CookingPrefsSelector from "@/components/CookingPrefsSelector";
import { Card } from "@/components/ui/card";

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
  const { user, subscriptionStatus } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [showPrefsSelector, setShowPrefsSelector] = useState(false);
  const [recentDishes, setRecentDishes] = useState<RecentDish[]>([]);

  const isPremium = subscriptionStatus?.subscribed;

  // Load scan usage and recent dishes on mount
  useEffect(() => {
    const loadScanUsage = async () => {
      if (!user || isPremium) {
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
  }, [user, isPremium]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is logged in
    if (!user) {
      toast({
        title: t.loginRequired,
        description: t.loginToUseScanner,
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check scan limit for free users
    if (!isPremium && scansRemaining !== null && scansRemaining <= 0) {
      setScanLimitReached(true);
      toast({
        title: t.scanLimitReached,
        description: t.upgradeToPremium,
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setAnalyzing(true);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Call edge function to analyze image
      const { data, error } = await supabase.functions.invoke(
        "analyze-ingredients",
        {
          body: { image: base64 },
        }
      );

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

      setIngredients(data.ingredients || []);
      
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

  const handlePrefsConfirm = (cookingTime: number, mood: 'tired' | 'normal' | 'motivated') => {
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

          {/* Scan Counter */}
          {user && !isPremium && scansRemaining !== null && (
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

          {/* Upload Area */}
          {!imagePreview ? (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center transition-all bg-card ${
                  scanLimitReached && !isPremium
                    ? 'border-muted cursor-not-allowed opacity-50'
                    : 'border-primary/50 hover:border-primary cursor-pointer'
                }`}
                onClick={() => {
                  if (scanLimitReached && !isPremium) return;
                  document.getElementById("imageInput")?.click();
                }}
              >
                <Upload className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-primary" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                  {t.uploadPhoto}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                  {t.takePhotoOrSelect}
                </p>
                <Button 
                  className="gradient-neon text-black font-semibold glow-button w-full sm:w-auto touch-target"
                  disabled={scanLimitReached && !isPremium}
                >
                  {t.selectImage}
                </Button>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
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
