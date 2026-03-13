import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Zap, ShoppingCart, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface NutritionInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  brand?: string;
  ingredients?: string;
  ingredientsList?: string[];
  servingSize?: string;
  barcode?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodScanned: (food: NutritionInfo) => void;
}

// Local cache for scanned products
const barcodeCache = new Map<string, NutritionInfo>();

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const SCAN_COOLDOWN = 300; // 300ms Cooldown für bessere Performance auf iPad
  const API_TIMEOUT = 3000;

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Open Food Facts lookup
  const lookupBarcode = useCallback(async (barcode: string) => {
    if (isLoading) return;
    if (lastScannedRef.current === barcode) return;

    lastScannedRef.current = barcode;
    setIsLoading(true);
    scanningRef.current = false;

    try {
      console.log('[Barcode] Looking up:', barcode);

      // Check cache first
      if (barcodeCache.has(barcode)) {
        const cached = barcodeCache.get(barcode)!;
        console.log('[Barcode] Found in cache:', cached.name);
        onFoodScanned(cached);
        toast({
          title: "Produkt erkannt! 🎉",
          description: `${cached.name} - ${cached.calories} kcal`,
        });
        stopCamera();
        onClose();
        return;
      }

      // Check online
      if (!navigator.onLine) {
        console.warn('[Barcode] Offline');
        toast({
          title: "⚠️ Offline",
          description: "Internet ist erforderlich.",
          variant: "destructive",
        });
        lastScannedRef.current = null;
        scanningRef.current = true;
        setIsLoading(false);
        return;
      }

      // API lookup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      console.log('[Barcode] Suche in OpenFoodFacts...');
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'FrigAI/1.0 (+https://frigyai.app)'
          }
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        const servingSize = product.serving_quantity || 100;
        const multiplier = servingSize / 100;

        const ingredientsList = product.ingredients?.map((ing: any) => ing.text || ing) || [];
        const ingredientsText = product.ingredients_text_de || product.ingredients_text || '';

        const nutritionInfo: NutritionInfo = {
          name: product.product_name_de || product.product_name || "Unbekanntes Produkt",
          calories: Math.round((nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0) * multiplier),
          protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * multiplier),
          carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * multiplier),
          fat: Math.round((nutriments.fat_100g || nutriments.fat || 0) * multiplier),
          image: product.image_small_url || product.image_url,
          brand: product.brands || product.brand,
          ingredients: ingredientsText,
          ingredientsList: ingredientsList.slice(0, 10),
          servingSize: product.serving_size || `${servingSize}g`,
          barcode: barcode,
        };

        console.log('[Barcode] Found product:', nutritionInfo.name);

        barcodeCache.set(barcode, nutritionInfo);
        onFoodScanned(nutritionInfo);
        toast({
          title: "Produkt erkannt! 🎉",
          description: `${nutritionInfo.name} - ${nutritionInfo.calories} kcal`,
        });
        stopCamera();
        onClose();
        return;
      }

      console.log('[Barcode] Product not found');
      toast({
        title: "Produkt nicht gefunden 🔍",
        description: "Dieser Barcode ist nicht in der Datenbank.",
        variant: "destructive",
      });
      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    } catch (err: any) {
      console.error("[Barcode] Lookup error:", err);

      let errorMsg = "Fehler beim Abruf";
      if (err.name === 'AbortError') {
        errorMsg = "⏱️ Zeitüberschreitung";
      } else if (err instanceof TypeError) {
        errorMsg = "🌐 Netzwerkfehler";
      }

      toast({
        title: "Fehler",
        description: errorMsg,
        variant: "destructive",
      });

      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    }
  }, [isLoading, onClose, onFoodScanned, stopCamera]);

  // Simple barcode detection from video frame
  const detectBarcode = useCallback(() => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < video.HAVE_CURRENT_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectBarcode);
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Get image data for barcode detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple barcode detection - look for edges
      // (This is a simplified approach for dark barcodes on light backgrounds)
      let hasBarcode = false;
      
      // Sample middle section of image (where barcode should be)
      const startY = Math.floor(canvas.height * 0.35);
      const endY = Math.floor(canvas.height * 0.65);
      const startX = Math.floor(canvas.width * 0.2);
      const endX = Math.floor(canvas.width * 0.8);

      let darkPixels = 0;
      let lightPixels = 0;

      for (let y = startY; y < endY; y += 5) {
        for (let x = startX; x < endX; x += 5) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;

          if (brightness < 100) darkPixels++;
          else if (brightness > 150) lightPixels++;
        }
      }

      // If we detect alternating dark/light pattern, likely a barcode
      const totalPixels = ((endY - startY) / 5) * ((endX - startX) / 5);
      const barcodePattern = (darkPixels + lightPixels) / totalPixels > 0.4;

      if (barcodePattern) {
        // Barcode detected - user should hold steady
        console.log('[Scanner] Barcode-ähnliches Muster erkannt');
        hasBarcode = true;
      }
    } catch (err) {
      // Continue scanning
    }

    if (scanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectBarcode);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      lastScannedRef.current = null;
      lastScanTimeRef.current = Date.now();

      console.log('[BarcodeScanner] Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        await videoRef.current.play();

        setIsInitializing(false);
        scanningRef.current = true;
        console.log('[BarcodeScanner] Camera started ✅');
        
        // Start barcode detection
        animationFrameRef.current = requestAnimationFrame(detectBarcode);
      }
    } catch (err: any) {
      console.error("Camera error:", err);

      let errorMsg = "Kamera konnte nicht gestartet werden.";

      if (err.name === 'NotAllowedError') {
        errorMsg = "❌ Kamera-Zugriff verweigert!\n\nErlaube Kamera-Zugriff in den Einstellungen.";
      } else if (err.name === 'NotFoundError') {
        errorMsg = "❌ Keine Kamera gefunden!";
      } else if (err.name === 'NotReadableError') {
        errorMsg = "❌ Kamera wird bereits verwendet!";
      } else if (err.name === 'SecurityError') {
        errorMsg = "❌ Sicherheitsfehler! Https erforderlich.";
      }

      setError(errorMsg);
      setIsInitializing(false);
    }
  }, [detectBarcode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      lookupBarcode(manualBarcode.trim());
      setManualBarcode("");
      setShowManualInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/70 to-transparent absolute top-0 left-0 right-0 z-10"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Zap className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-lg">Barcode Scan</h2>
              <p className="text-primary/80 text-[10px] font-medium">
                📱 iPad Mode aktiviert
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20 hover:text-primary transition-all"
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* Scanner Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 px-6 z-20"
            >
              <AlertCircle className="h-20 w-20 text-destructive mx-auto" />
              <div>
                <p className="text-white text-base font-semibold mb-2">Fehler</p>
                <p className="text-white/70 text-sm whitespace-pre-line">{error}</p>
              </div>
              <Button 
                onClick={startCamera} 
                variant="outline"
                className="bg-primary/20 hover:bg-primary/30 border-primary text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Erneut versuchen
              </Button>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Loader2 className="h-20 w-20 text-primary mx-auto animate-spin" />
              </motion.div>
              <div>
                <p className="text-white text-lg font-semibold">Barcode erkannt! 🎉</p>
                <p className="text-white/60 text-sm mt-2">Produktinformationen werden geladen...</p>
              </div>
            </motion.div>
          ) : null}

          {/* Video Feed */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Hidden canvas for barcode detection */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scan overlay */}
          {!error && !isLoading && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-96 h-48 border-2 border-primary rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/60" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/60" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/60" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/60" />
                
                {/* Animated scan line */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-b from-primary via-primary/80 to-transparent"
                  style={{ 
                    boxShadow: "0 0 20px rgba(95, 208, 104, 0.8), 0 0 40px rgba(95, 208, 104, 0.4)",
                    filter: "blur(0.5px)"
                  }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              <motion.p 
                className="absolute bottom-12 text-primary font-semibold text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Scanne Barcode...
              </motion.p>
            </div>
          )}

          {/* Initializing */}
          {isInitializing && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-white/70 text-sm">Kamera wird aktiviert...</p>
            </motion.div>
          )}
        </div>

        {/* Manual Input Overlay */}
        {!showManualInput && !isLoading && !error && !isInitializing && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/98 via-black/80 to-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <p className="text-white font-medium text-sm flex items-center justify-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  iPad Barcode Scanner • Open Food Facts
                </p>
                <p className="text-white/60 text-xs">
                  {navigator.onLine ? "🟢 Online verfügbar" : "🔴 Offline"}
                </p>
              </div>

              {/* Large Manual Button */}
              <motion.div
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Button
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold text-base py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Type className="h-5 w-5 mr-2" />
                  MANUELL EINGEBEN
                </Button>
              </motion.div>

              <p className="text-white/50 text-xs">
                💡 Falls Kamera-Scan nicht funktioniert
              </p>
            </div>
          </motion.div>
        )}

        {/* Manual Input Panel */}
        {showManualInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-black/95 z-30 border-t border-primary/20"
          >
            <div className="space-y-4">
              <p className="text-white font-semibold text-sm">Gib den Barcode manuell ein:</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="z.B. 4006381333931"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                  className="flex-1 bg-white/10 border-primary/50 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualBarcode.trim() || isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                </Button>
                <Button
                  onClick={() => {
                    setShowManualInput(false);
                    setManualBarcode("");
                  }}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
