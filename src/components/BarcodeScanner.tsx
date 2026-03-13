import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Zap, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const SCAN_COOLDOWN = 100; // Ultra-schnelle Erkennung: nur 100ms Cooldown
  const API_TIMEOUT = 3000; // 3 Sekunden für API-Antwort (optimiert auf 1s durchschnittlich)

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

      // Prüfe Internetverbindung
      if (!navigator.onLine) {
        console.warn('[Barcode] Keine Internetverbindung');
        toast({
          title: "⚠️ Offline",
          description: "Internet ist erforderlich. Verbinde dich mit WiFi oder Mobilfunk.",
          variant: "destructive",
        });
        lastScannedRef.current = null;
        scanningRef.current = true;
        setIsLoading(false);
        return;
      }

      // API lookup with optimized timeout (1-3 Sekunden)
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

        // Berechne pro Portion wenn vorhanden, sonst pro 100g
        const servingSize = product.serving_quantity || 100;
        const multiplier = servingSize / 100;

        // Parse ingredients list
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
          ingredientsList: ingredientsList.slice(0, 10), // First 10 ingredients
          servingSize: product.serving_size || `${servingSize}g`,
          barcode: barcode,
        };

        console.log('[Barcode] Found product:', nutritionInfo.name, {
          brand: nutritionInfo.brand,
          ingredients: ingredientsText?.substring(0, 100),
          servingSize: nutritionInfo.servingSize
        });

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
        title: "Produkt nicht gefunden 🔍",
        description: "Dieser Barcode ist nicht in der Datenbank. Versuche einen anderen Code.",
        variant: "destructive",
      });
      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    } catch (err: any) {
      console.error("[Barcode] Lookup error:", err);

      let errorMsg = "Fehler beim Abruf";

      // Handle timeout
      if (err.name === 'AbortError') {
        console.log('[Barcode] Lookup timeout - API zu langsam');
        errorMsg = "⏱️ Zeitüberschreitung - OpenFoodFacts antwortet nicht";
        toast({
          title: "Zu langsam",
          description: errorMsg,
          variant: "destructive",
        });
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        console.log('[Barcode] Network error');
        errorMsg = "🌐 Netzwerkfehler - Prüfe deine Internetverbindung";
        toast({
          title: "Keine Verbindung",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler",
          description: errorMsg,
          variant: "destructive",
        });
      }

      lastScannedRef.current = null;
      scanningRef.current = true;
      setIsLoading(false);
    }
  }, [isLoading, onClose, onFoodScanned, stopCamera, API_TIMEOUT]);

  // Ultra-schnelle native Erkennung - kontinuierlich
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
        const now = Date.now();
        const barcode = barcodes[0].rawValue;

        // Ultra-schnelle Erkennung - 100ms Cooldown
        if (now - lastScanTimeRef.current >= SCAN_COOLDOWN && lastScannedRef.current !== barcode) {
          lastScanTimeRef.current = now;
          lookupBarcode(barcode);
          return;
        }
      }
    } catch {
      // Continue scanning
    }

    if (scanningRef.current) {
      // Kontinuierlich scannen ohne Verzögerung
      animationFrameRef.current = requestAnimationFrame(detectBarcodes);
    }
  }, [lookupBarcode, SCAN_COOLDOWN]);

  // Start with native BarcodeDetector (Chrome, Edge)
  const startNativeScanner = useCallback(async () => {
    try {
      // Überprüfe ob BarcodeDetector wirklich unterstützt wird
      if (!('BarcodeDetector' in window)) {
        console.warn('[BarcodeScanner] BarcodeDetector nicht unterstützt, nutze Fallback');
        throw new Error('BarcodeDetector nicht verfügbar');
      }

      // Überprüfe ob die Formate unterstützt werden
      const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats?.();
      console.log('[BarcodeScanner] Unterstützte Formate:', supportedFormats);

      detectorRef.current = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 } // Maximum fps für schnelle Erkennung
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        lastScanTimeRef.current = Date.now();
        setIsInitializing(false);
        scanningRef.current = true;

        console.log('[BarcodeScanner] Native BarcodeDetector gestartet ⚡');
        animationFrameRef.current = requestAnimationFrame(detectBarcodes);
      }
    } catch (err) {
      console.warn('[BarcodeScanner] Native Detector fehlgeschlagen, nutze Fallback:', err);
      // Fallback auf Html5Qrcode
      await startFallbackScanner();
    }
  }, [detectBarcodes, startFallbackScanner]);

  // Fallback for Safari/Firefox and when BarcodeDetector fails
  const startFallbackScanner = useCallback(async () => {
    try {
      console.log('[BarcodeScanner] Starte Html5Qrcode Fallback für Safari/iPad...');

      // Stelle sicher, dass Container existiert
      const container = document.getElementById("barcode-reader-fallback");
      if (!container) {
        console.error('[BarcodeScanner] Container nicht gefunden');
        setError("Scanner Container konnte nicht geladen werden");
        setIsInitializing(false);
        return;
      }

      // Für iPad/Safari: Geben Sie Zeit für DOM zu aktualisieren
      await new Promise(resolve => setTimeout(resolve, 100));

      const scanner = new Html5Qrcode("barcode-reader-fallback", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: true // Debug-Modus für bessere Fehlerbehandlung
      });
      html5QrcodeRef.current = scanner;

      // iPad-optimierte Einstellungen
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: isIOS ? 15 : 30, // iPad: niedrigere fps für bessere Performance
          qrbox: { width: 350, height: 300 }, // Größerer Erkennungsbereich für iPad
          disableFlip: isIOS ? true : false, // iPad: deaktiviere Flip
          aspectRatio: isIOS ? undefined : 1.33333, // iPad: lasse Browser Verhältnis wählen
          useBarCodeDetectorIfSupported: false, // Erzwinge Html5Qrcode auch wenn BarcodeDetector verfügbar wäre
        },
        async (decodedText) => {
          // Schneller Cooldown im Fallback
          const now = Date.now();
          console.log('[BarcodeScanner] Barcode erkannt:', decodedText);
          if (now - lastScanTimeRef.current >= SCAN_COOLDOWN && lastScannedRef.current !== decodedText) {
            lastScanTimeRef.current = now;
            lastScannedRef.current = decodedText;
            await lookupBarcode(decodedText);
          }
        },
        (error) => {
          // Error callback - logg aber nicht zu verbose
          if (error && !error.toString().includes('No QR code found')) {
            console.log('[BarcodeScanner] Scan-Versuch:', error?.toString?.());
          }
        }
      );

      lastScanTimeRef.current = Date.now();
      setIsInitializing(false);
      scanningRef.current = true;
      console.log('[BarcodeScanner] Html5Qrcode Fallback gestartet 📱', { isIOS });
    } catch (err: any) {
      console.error('[BarcodeScanner] Fallback-Fehler:', err);
      setError(`Barcode-Scanner konnte nicht gestartet werden: ${err.message || err}`);
      setIsInitializing(false);
    }
  }, [lookupBarcode, SCAN_COOLDOWN]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      lastScannedRef.current = null;
      lastScanTimeRef.current = Date.now();

      // Debug-Info: Welcher Scanner wird verwendet
      console.log('[BarcodeScanner] Starting...', {
        hasNative: hasNativeBarcodeDetector,
        userAgent: navigator.userAgent.substring(0, 50),
        onLine: navigator.onLine,
        isSecure: window.location.protocol === 'https:'
      });

      // Prüfe HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('SecurityError');
      }

      // Prüfe Internetverbindung
      if (!navigator.onLine) {
        throw new Error('Offline - Internetverbindung erforderlich');
      }

      if (hasNativeBarcodeDetector) {
        console.log('[BarcodeScanner] Versuche Native BarcodeDetector API (schneller)');
        await startNativeScanner();
      } else {
        console.log('[BarcodeScanner] BarcodeDetector nicht verfügbar, nutze Html5Qrcode Fallback');
        await startFallbackScanner();
      }
    } catch (err: any) {
      console.error("Camera error:", err);

      let errorMsg = "Kamera konnte nicht gestartet werden.";

      if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
        errorMsg = "❌ Kamera-Zugriff verweigert!\n\n1. Klick auf das 🔒-Symbol in der Browserleiste\n2. Erlaube Kamera-Zugriff\n3. Versuche erneut";
      } else if (err.name === 'NotFoundError' || err.message?.includes('No camera')) {
        errorMsg = "❌ Keine Kamera gefunden!\n\nStelle sicher, dass:\n1. Ein Gerät mit Kamera vorhanden ist\n2. Es nicht von anderer App blockiert wird";
      } else if (err.name === 'NotReadableError') {
        errorMsg = "❌ Kamera wird bereits verwendet!\n\nAnwendungen schließen und erneut versuchen.";
      } else if (err.name === 'SecurityError' || err.message?.includes('SecurityError')) {
        errorMsg = "❌ Sicherheitsfehler!\n\nHttps ist erforderlich (nicht Http).";
      } else if (err.message?.includes('Offline')) {
        errorMsg = "❌ Keine Internetverbindung!\n\nVerbinde dich mit WiFi oder Mobilfunk.";
      }

      console.error('[BarcodeScanner] Error:', { name: err.name, message: err.message });
      setError(errorMsg);
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
        {/* Header - Enhanced */}
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
                {hasNativeBarcodeDetector ? "⚡ Ultra-Modus aktiv" : "📱 Kompatibilitätsmodus"}
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
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <AlertCircle className="h-20 w-20 text-destructive mx-auto" />
              </motion.div>
              <div>
                <p className="text-white text-base font-semibold mb-2">Fehler beim Kamerazugriff</p>
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
              <motion.div
                className="flex gap-2"
                animate={{ gap: ["0.5rem", "1rem", "0.5rem"] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="h-2 w-2 bg-primary rounded-full" />
                <div className="h-2 w-2 bg-primary rounded-full" />
                <div className="h-2 w-2 bg-primary rounded-full" />
              </motion.div>
            </motion.div>
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

          {/* Scan overlay - Enhanced Animation */}
          {hasNativeBarcodeDetector && !error && !isLoading && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-96 h-48 border-2 border-primary rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/60" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/60" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/60" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/60" />

                {/* Animated scan line - Ultra-smooth */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-b from-primary via-primary/80 to-transparent"
                  style={{
                    boxShadow: "0 0 20px rgba(95, 208, 104, 0.8), 0 0 40px rgba(95, 208, 104, 0.4)",
                    filter: "blur(0.5px)"
                  }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Pulsing background effect */}
                <motion.div
                  className="absolute inset-0 bg-primary/0"
                  animate={{ backgroundColor: ["rgba(95, 208, 104, 0)", "rgba(95, 208, 104, 0.05)", "rgba(95, 208, 104, 0)"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Scanning indicator text */}
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

        {/* Footer - Enhanced */}
        <div className="p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent absolute bottom-0 left-0 right-0">
          <motion.div
            className="text-center space-y-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-white font-medium text-sm flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {hasNativeBarcodeDetector ? "⚡ Ultra-Schneller Scan Modus" : "📱 Kompatibilitätsmodus (iPad/Safari)"} • Open Food Facts
            </p>
            <p className="text-white/60 text-xs">
              {navigator.onLine ? "🟢 Online verfügbar" : "🔴 Offline - Bitte Internet verbinden"}
            </p>
            {!hasNativeBarcodeDetector && (
              <p className="text-white/50 text-[10px] mt-1">
                💡 Tipp: Halte Barcode ruhig und mittig in die Scan-Box für beste Erkennung
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
