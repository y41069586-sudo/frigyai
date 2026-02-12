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

// Local cache for scanned products
const barcodeCache = new Map<string, NutritionInfo>();

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
  const animationFrameRef = useRef<number | null>(null);

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
    
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch(() => {});
      html5QrcodeRef.current = null;
    }
  }, []);

  // Open Food Facts lookup - kostenlos und gut für EU/DE Produkte (mit Caching und Timeout)
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

      // API lookup with 1.5s timeout for fast response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};

        // Berechne pro Portion wenn vorhanden, sonst pro 100g
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

        console.log('[Barcode] Found product:', nutritionInfo.name);

        // Cache for future scans
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

      // Produkt nicht gefunden
      console.log('[Barcode] Product not found in Open Food Facts');
      toast({
        title: "Produkt nicht gefunden",
        description: "Dieser Barcode ist nicht in der Datenbank. Versuche es manuell einzugeben.",
        variant: "destructive",
      });
      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    } catch (err: any) {
      console.error("[Barcode] Lookup error:", err);

      // Handle timeout gracefully
      if (err.name === 'AbortError') {
        console.log('[Barcode] Lookup timeout, trying again...');
        lastScannedRef.current = null;
        scanningRef.current = true;
        setIsLoading(false);
        return;
      }

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

  // Ultra-fast native detection loop
  const detectBarcodes = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return;
    
    const video = videoRef.current;
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectBarcodes);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(video);
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        lookupBarcode(barcodes[0].rawValue);
        return;
      }
    } catch {
      // Continue scanning
    }

    if (scanningRef.current) {
      // Optimized: Use requestAnimationFrame for faster scanning (no 50ms delay)
      animationFrameRef.current = requestAnimationFrame(detectBarcodes);
    }
  }, [lookupBarcode]);

  // Start with native BarcodeDetector (Chrome, Edge)
  const startNativeScanner = useCallback(async () => {
    detectorRef.current = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    });

    streamRef.current = stream;
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      setIsInitializing(false);
      scanningRef.current = true;
      
      animationFrameRef.current = requestAnimationFrame(detectBarcodes);
    }
  }, [detectBarcodes]);

  // Fallback for Safari/Firefox
  const startFallbackScanner = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const scanner = new Html5Qrcode("barcode-reader-fallback", { 
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ], 
      verbose: false 
    });
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
        setError("Kamera-Zugriff verweigert. Bitte erlaube den Zugriff.");
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
    return () => stopCamera();
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
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          {error ? (
            <div className="text-center space-y-4 px-6 z-20">
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

          {/* Native Video Feed */}
          {hasNativeBarcodeDetector && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}

          {/* Fallback Scanner */}
          {!hasNativeBarcodeDetector && (
            <div id="barcode-reader-fallback" className="w-full h-full" />
          )}

          {/* Scan overlay */}
          {hasNativeBarcodeDetector && !error && !isLoading && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-80 h-36 border-2 border-primary/50 rounded-xl">
                <motion.div
                  className="absolute inset-x-2 h-0.5 bg-primary rounded-full"
                  style={{ boxShadow: "0 0 15px rgba(95, 208, 104, 1)" }}
                  animate={{ top: ["5%", "95%", "5%"] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          )}

          {/* Initializing */}
          {isInitializing && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-black to-transparent absolute bottom-0 left-0 right-0">
          <p className="text-center text-white/60 text-xs">
            {hasNativeBarcodeDetector ? "⚡ Sofort-Erkennung aktiv" : "Safari-Modus"} • Open Food Facts
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
