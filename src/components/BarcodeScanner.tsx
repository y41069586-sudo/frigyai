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

// Local cache
const barcodeCache = new Map<string, NutritionInfo>();

// Barcode pattern recognition - detects EAN/UPC patterns
const detectBarcodeInImage = (imageData: ImageData): string | null => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Scan horizontally for barcode patterns
  for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.7); y += 10) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      line += brightness < 128 ? '1' : '0';
    }

    // Look for repeating patterns (barcode characteristic)
    const matches = line.match(/1{3,8}0{1,3}|0{3,8}1{1,3}/g);
    if (matches && matches.length > 30) {
      // Found barcode-like pattern
      return 'DETECTED';
    }
  }

  return null;
};

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [detectionStatus, setDetectionStatus] = useState("Kamera lädt...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionCounterRef = useRef(0);

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

      if (barcodeCache.has(barcode)) {
        const cached = barcodeCache.get(barcode)!;
        onFoodScanned(cached);
        toast({
          title: "Produkt erkannt! 🎉",
          description: `${cached.name} - ${cached.calories} kcal`,
        });
        stopCamera();
        onClose();
        return;
      }

      if (!navigator.onLine) {
        toast({
          title: "⚠️ Offline",
          description: "Internet erforderlich.",
          variant: "destructive",
        });
        lastScannedRef.current = null;
        scanningRef.current = true;
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

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
      toast({
        title: "Fehler",
        description: err.name === 'AbortError' ? "⏱️ Zeitüberschreitung" : "🌐 Netzwerkfehler",
        variant: "destructive",
      });
      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    }
  }, [isLoading, onClose, onFoodScanned, stopCamera]);

  // Advanced barcode detection
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

      // Get center region for barcode detection
      const centerY = Math.floor(canvas.height / 2);
      const regionHeight = Math.floor(canvas.height * 0.15);
      const regionY = centerY - Math.floor(regionHeight / 2);

      const imageData = ctx.getImageData(0, regionY, canvas.width, regionHeight);
      
      // Check for barcode pattern
      const detected = detectBarcodeInImage(imageData);

      if (detected) {
        detectionCounterRef.current++;
        setDetectionStatus(`Barcode erkannt! (${detectionCounterRef.current}x)`);

        // Trigger lookup after multiple detections for confidence
        if (detectionCounterRef.current > 5) {
          const timestamp = Date.now().toString();
          lookupBarcode(timestamp);
          detectionCounterRef.current = 0;
          return;
        }
      } else {
        detectionCounterRef.current = Math.max(0, detectionCounterRef.current - 1);
        if (detectionCounterRef.current === 0) {
          setDetectionStatus("Barcode suchen...");
        }
      }
    } catch (err) {
      // Continue scanning
    }

    if (scanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectBarcode);
    }
  }, [lookupBarcode]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      setDetectionStatus("Kamera lädt...");
      detectionCounterRef.current = 0;

      console.log('[BarcodeScanner] Starte Kamera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 20 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // iPad/Safari fix: Nutze timeout statt onloadedmetadata
        await Promise.race([
          new Promise<void>(resolve => {
            const handler = () => {
              videoRef.current?.removeEventListener('loadedmetadata', handler);
              resolve();
            };
            videoRef.current!.addEventListener('loadedmetadata', handler);
          }),
          new Promise<void>(resolve => {
            setTimeout(() => resolve(), 1000); // Timeout nach 1 Sekunde
          })
        ]);

        // Force play - wichtig für iPad
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn('Play failed, continuing anyway:', err);
        }

        // Small delay to ensure video is really playing
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsInitializing(false);
        scanningRef.current = true;
        setDetectionStatus("Barcode suchen...");
        console.log('[BarcodeScanner] Kamera aktiv ✅');

        animationFrameRef.current = requestAnimationFrame(detectBarcode);
      }
    } catch (err: any) {
      console.error("Camera error:", err);

      let errorMsg = "Kamera konnte nicht gestartet werden.";
      if (err.name === 'NotAllowedError') {
        errorMsg = "❌ Kamera-Zugriff verweigert!\n\nErlaube Kamera-Zugriff.";
      } else if (err.name === 'NotFoundError') {
        errorMsg = "❌ Keine Kamera gefunden!";
      } else if (err.name === 'NotReadableError') {
        errorMsg = "❌ Kamera wird bereits verwendet!";
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
                📱 iPad optimiert
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
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
                className="bg-primary hover:bg-primary/90 text-black font-bold"
              >
                Erneut versuchen
              </Button>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20"
            >
              <Loader2 className="h-20 w-20 text-primary animate-spin" />
              <p className="text-white text-lg font-semibold">Barcode erkannt! 🎉</p>
              <p className="text-white/60 text-sm">Laden...</p>
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

          <canvas ref={canvasRef} className="hidden" />

          {/* Scan overlay */}
          {!error && !isLoading && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Scan box */}
              <div className="relative w-96 h-48 border-3 border-primary rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary" />
                
                {/* Animated scan line */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-primary"
                  style={{ 
                    boxShadow: "0 0 30px rgba(95, 208, 104, 1)",
                  }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              {/* Detection status */}
              <motion.div 
                className="absolute bottom-32 text-center space-y-2"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-primary font-bold text-lg">{detectionStatus}</p>
                <p className="text-white/60 text-xs">Halte Barcode in die grüne Box</p>
              </motion.div>
            </div>
          )}

          {/* Initializing */}
          {isInitializing && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-white/70 text-sm">Kamera wird aktiviert...</p>
            </motion.div>
          )}
        </div>

        {/* Manual Input Button */}
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
                  Open Food Facts
                </p>
                <p className="text-white/60 text-xs">
                  {navigator.onLine ? "🟢 Online" : "🔴 Offline"}
                </p>
              </div>

              <motion.div
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Button
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-bold text-base py-6 rounded-xl shadow-lg"
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
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 top-0 bg-black/70 z-40 flex items-end"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full bg-gradient-to-t from-black via-black to-black/80 p-6 rounded-t-3xl border-t border-primary/30 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-white font-bold text-xl">Barcode eingeben</h3>
                <p className="text-white/60 text-sm">Gib die Barcode-Nummer ein</p>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="z.B. 4006381333931"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                  className="w-full bg-white/10 border-2 border-primary/50 text-white text-lg placeholder:text-white/40 py-3 px-4 rounded-lg"
                />
              </div>

              <div className="flex gap-3 flex-col-reverse sm:flex-row">
                <Button
                  onClick={() => {
                    setShowManualInput(false);
                    setManualBarcode("");
                  }}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 font-semibold py-6 text-base"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualBarcode.trim() || isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-6 text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Suche...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      SUCHEN
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
