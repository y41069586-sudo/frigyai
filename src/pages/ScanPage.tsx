import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, ArrowLeft, Camera, Crown, AlertCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import IngredientsList from "@/components/IngredientsList";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const FREE_SCAN_LIMIT = 2;

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, subscriptionStatus } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [mode, setMode] = useState<"photo" | "video">("photo");

  const isPremium = subscriptionStatus?.subscribed;

  // Load scan usage on mount
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

    loadScanUsage();
  }, [user, isPremium]);


  const startVideoRecording = async () => {
    if (!user) {
      toast({
        title: t.loginRequired,
        description: t.loginToUseScanner,
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!isPremium && scansRemaining !== null && scansRemaining <= 0) {
      setScanLimitReached(true);
      toast({
        title: t.scanLimitReached,
        description: t.upgradeToPremium,
        variant: "destructive",
      });
      return;
    }

    // Use native file input for video capture - works better on mobile
    document.getElementById("videoInput")?.click();
  };

  const [videoProcessing, setVideoProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const processingMessages = [
    "Video wird verarbeitet...",
    "Frames werden analysiert...",
    "Zutaten werden erkannt...",
    "Bitte haben Sie Geduld...",
    "Fast fertig...",
  ];

  // Cycle through processing messages
  useEffect(() => {
    if (!videoProcessing) return;
    
    let messageIndex = 0;
    setProcessingMessage(processingMessages[0]);
    
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % processingMessages.length;
      setProcessingMessage(processingMessages[messageIndex]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [videoProcessing]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show video processing state with animations
    setVideoProcessing(true);
    setAnalyzing(true);
    setUploading(true);

    try {
      // Create video element to extract multiple frames
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Video konnte nicht geladen werden"));
      });

      // Extract frame from middle of video for best quality
      const duration = video.duration;
      video.currentTime = duration / 2;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Extract frame to canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      setImagePreview(base64);

      // Call edge function to analyze image
      const { data, error } = await supabase.functions.invoke(
        "analyze-ingredients",
        {
          body: { image: base64 },
        }
      );

      if (error) {
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
      
      if (data.scansRemaining !== undefined && data.scansRemaining !== null) {
        setScansRemaining(data.scansRemaining);
      }

      toast({
        title: t.ingredientsRecognized,
        description: `${data.ingredients?.length || 0} ${t.ingredientsFound}.`,
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast({
        title: t.error,
        description: t.couldNotAnalyze,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setVideoProcessing(false);
    }
  };


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
    navigate("/recipes", { state: { ingredients } });
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
              onClick={() => navigate("/")}
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

          {/* Mode Toggle */}
          {!imagePreview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-2 mb-6"
            >
              <Button
                variant={mode === "photo" ? "default" : "outline"}
                onClick={() => setMode("photo")}
                className={mode === "photo" ? "gradient-neon text-black" : ""}
              >
                <Camera className="h-4 w-4 mr-2" />
                Foto
              </Button>
              <Button
                variant={mode === "video" ? "default" : "outline"}
                onClick={() => setMode("video")}
                className={mode === "video" ? "gradient-neon text-black" : ""}
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
            </motion.div>
          )}

          {/* Upload Area */}
          {!imagePreview ? (
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
                if (mode === "photo") {
                  document.getElementById("imageInput")?.click();
                } else {
                  startVideoRecording();
                }
              }}
            >
              {mode === "photo" ? (
                <>
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
                </>
              ) : (
                <>
                  <Video className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                    Video aufnehmen
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                    Filme deinen Kühlschrank für eine bessere Erkennung
                  </p>
                  <Button 
                    className="gradient-neon text-black font-semibold glow-button w-full sm:w-auto touch-target"
                    disabled={scanLimitReached && !isPremium}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Aufnahme starten
                  </Button>
                </>
              )}
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
                disabled={scanLimitReached && !isPremium}
              />
              <input
                id="videoInput"
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={scanLimitReached && !isPremium}
              />
            </motion.div>
          ) : imagePreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Image Preview */}
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={imagePreview}
                  alt={t.scanFridge}
                  className="w-full h-auto"
                />
              </div>

              {analyzing ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary relative z-10" />
                  </motion.div>
                  <motion.p 
                    key={videoProcessing ? processingMessage : "analyzing"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg text-muted-foreground"
                  >
                    {videoProcessing ? processingMessage : t.aiAnalyzingIngredients}
                  </motion.p>
                  {videoProcessing && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-sm text-muted-foreground/70 mt-2"
                    >
                      Wir analysieren dein Video im Hintergrund...
                    </motion.p>
                  )}
                </div>
              ) : (
                <>
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
                      {t.generateRecipes}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScanPage;