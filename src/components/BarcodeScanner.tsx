import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface NutritionInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodScanned: (food: NutritionInfo) => void;
}

// Check if native BarcodeDetector is available
const hasNativeBarcodeDetector = 'BarcodeDetector' in window;

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    
    // Stop native stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop html5-qrcode
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch(() => {});
      html5QrcodeRef.current = null;
    }
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    if (isLoading) return;
    
    // Prevent duplicate scans
    if (lastScannedRef.current === barcode) return;
    lastScannedRef.current = barcode;
    
    setIsLoading(true);
    scanningRef.current = false;

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        const servingSize = product.serving_quantity || 100;
        const multiplier = servingSize / 100;

        const nutritionInfo: NutritionInfo = {
          name: product.product_name_de || product.product_name || "Unbekanntes Produkt",
          calories: Math.round((nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0) * multiplier),
          protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * multiplier),
          carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * multiplier),
          fat: Math.round((nutriments.fat_100g || nutriments.fat || 0) * multiplier),
          image: product.image_small_url || product.image_url,
        };

        onFoodScanned(nutritionInfo);
        toast({
          title: "Produkt erkannt! 🎉",
          description: `${nutritionInfo.name} - ${nutritionInfo.calories} kcal`,
        });
        stopCamera();
        onClose();
      } else {
        toast({
          title: "Produkt nicht gefunden",
          description: "Dieser Barcode ist nicht in der Datenbank.",
          variant: "destructive",
        });
        lastScannedRef.current = null;
        scanningRef.current = true;
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht abgerufen werden.",
        variant: "destructive",
      });
      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    }
  }, [isLoading, onClose, onFoodScanned, stopCamera]);

  // Native BarcodeDetector detection loop
  const detectBarcodes = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return;
    
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(detectBarcodes);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(video);
      if (barcodes.length > 0) {
        const barcode = barcodes[0].rawValue;
        if (barcode) {
          await lookupBarcode(barcode);
          return;
        }
      }
    } catch (err) {
      // Detection failed, continue scanning
    }

    if (scanningRef.current) {
      requestAnimationFrame(detectBarcodes);
    }
  }, [lookupBarcode]);

  // Start with native BarcodeDetector (Chrome, Edge)
  const startNativeScanner = useCallback(async () => {
    try {
      detectorRef.current = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        setIsInitializing(false);
        scanningRef.current = true;
        requestAnimationFrame(detectBarcodes);
      }
    } catch (err: any) {
      throw err;
    }
  }, [detectBarcodes]);

  // Fallback to html5-qrcode (Safari, Firefox)
  const startFallbackScanner = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ];
      
      const scanner = new Html5Qrcode("barcode-reader-fallback", { formatsToSupport, verbose: false });
      html5QrcodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 30,
          qrbox: { width: 300, height: 150 },
          disableFlip: true,
        },
        async (decodedText) => {
          await lookupBarcode(decodedText);
        },
        () => {}
      );
      
      setIsInitializing(false);
      scanningRef.current = true;
    } catch (err: any) {
      throw err;
    }
  }, [lookupBarcode]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      lastScannedRef.current = null;

      if (hasNativeBarcodeDetector) {
        await startNativeScanner();
      } else {
        await startFallbackScanner();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === 'NotAllowedError') {
        setError("Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.");
      } else if (err.name === 'NotFoundError') {
        setError("Keine Kamera gefunden.");
      } else {
        setError("Kamera konnte nicht gestartet werden.");
      }
      setIsInitializing(false);
    }
  }, [startNativeScanner, startFallbackScanner]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
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
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-white font-semibold text-lg">Barcode scannen</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Scanner Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {error ? (
            <div className="text-center space-y-4 px-6">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-white text-sm">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Erneut versuchen
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center space-y-4 absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
              <p className="text-white text-sm">Produkt wird gesucht...</p>
            </div>
          ) : null}

          {/* Native Video Feed (Chrome, Edge) */}
          {hasNativeBarcodeDetector && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}

          {/* Fallback Scanner Container (Safari, Firefox) */}
          {!hasNativeBarcodeDetector && (
            <div 
              id="barcode-reader-fallback" 
              className="w-full h-full"
            />
          )}

          {/* Scan overlay - only for native scanner */}
          {hasNativeBarcodeDetector && !error && !isLoading && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-72 h-32">
                <motion.div 
                  className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-primary rounded-tl-lg"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-primary rounded-tr-lg"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-primary rounded-bl-lg"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
                <motion.div 
                  className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-primary rounded-br-lg"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                />
                
                <motion.div
                  className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                  style={{ boxShadow: "0 0 20px rgba(95, 208, 104, 0.8)" }}
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          {/* Initializing overlay */}
          {isInitializing && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                <p className="text-white text-sm">Kamera wird gestartet...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
          <p className="text-center text-white/70 text-sm">
            Halte den Barcode vor die Kamera
          </p>
          <p className="text-center text-white/40 text-xs mt-1">
            {hasNativeBarcodeDetector ? "Native API • Soforterkennung" : "Safari-Modus aktiv"}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
