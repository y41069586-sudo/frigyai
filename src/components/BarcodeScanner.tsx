import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface NutritionInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  brand?: string;
  barcode?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodScanned: (food: NutritionInfo) => void;
}

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<NutritionInfo | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const quaggaRef = useRef<any>(null);
  const detectionLockRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Quagga2 library from CDN
  useEffect(() => {
    // Only load if not already loaded
    if ((window as any).Quagga) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@ericblade/quagga2/dist/quagga.min.js';
    script.async = true;
    script.onload = () => {
      console.log('[BarcodeScanner] Quagga2 loaded successfully');
    };
    script.onerror = () => {
      console.error('[BarcodeScanner] Failed to load Quagga2');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setError(null);
    setProductData(null);
    setIsLoading(false);
    setIsScannerActive(false);
    detectionLockRef.current = false;

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    try {
      // Clear any pending timeouts
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      const Quagga = (window as any).Quagga;
      if (Quagga && quaggaRef.current) {
        try {
          Quagga.stop();
          console.log('[BarcodeScanner] Scanner stopped');
        } catch (stopErr) {
          console.warn('[BarcodeScanner] Error stopping Quagga scanner:', stopErr);
        }
        quaggaRef.current = null;
      }
      setIsScannerActive(false);
    } catch (err) {
      console.error('[BarcodeScanner] Unexpected error in stopScanner:', err);
      setIsScannerActive(false);
    }
  };

  const startScanner = async () => {
    try {
      setError(null);
      setIsScannerActive(false);
      detectionLockRef.current = false;

      // Wait for Quagga to be loaded (max 5 seconds)
      let attempts = 0;
      while (!(window as any).Quagga && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      const Quagga = (window as any).Quagga;
      if (!Quagga) {
        console.error('[BarcodeScanner] Quagga2 failed to load after 5 seconds');
        setError('❌ Quagga2 Library konnte nicht geladen werden');
        return;
      }

      console.log('[BarcodeScanner] Starting scanner...');
      quaggaRef.current = Quagga;

      // Initialize Quagga with optimized settings for fast detection
      await new Promise<void>((resolve, reject) => {
        const initTimeout = setTimeout(() => {
          reject(new Error('Quagga initialization timeout'));
        }, 10000);

        Quagga.init(
          {
            frequency: 10,
            inputStream: {
              type: 'LiveStream',
              target: document.querySelector('#barcode-reader'),
              constraints: {
                facingMode: 'environment',
                width: 1280,
                height: 720,
              },
            },
            locator: {
              patchSize: 'large',
              halfSample: true,
            },
            locate: true,
            numOfWorkers: 4,
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'upc_reader',
              ],
            },
          },
          (err: any) => {
            clearTimeout(initTimeout);
            if (err) {
              console.error('[BarcodeScanner] Quagga init error:', err);
              reject(err);
            } else {
              console.log('[BarcodeScanner] Quagga initialized, starting...');
              Quagga.start();
              setIsScannerActive(true);
              resolve();
            }
          }
        );
      });

      // Set up detection handler with debouncing
      Quagga.onDetected((data: any) => {
        if (data?.codeResult?.code) {
          console.log('[BarcodeScanner] Barcode detected:', data.codeResult.code);
          handleBarcodeDetected(data.codeResult.code);
        }
      });

      console.log('[BarcodeScanner] Scanner started successfully');
    } catch (err: any) {
      console.error('[BarcodeScanner] Scanner init error:', err);

      let errorMsg = '❌ Kamera konnte nicht gestartet werden';
      if (err.message?.includes('NotAllowedError')) {
        errorMsg = '❌ Kamera-Zugriff verweigert!';
      } else if (err.message?.includes('NotFoundError')) {
        errorMsg = '❌ Keine Kamera gefunden!';
      } else if (err.message?.includes('NotReadableError')) {
        errorMsg = '❌ Kamera wird bereits verwendet!';
      } else if (err.message?.includes('timeout')) {
        errorMsg = '❌ Kamera-Initialisierung zu langsam';
      }

      setError(errorMsg);
      setIsScannerActive(false);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    // Prevent duplicate detections
    if (!barcode || detectionLockRef.current || productData) {
      console.log('[BarcodeScanner] Skipping detection:', { barcode, locked: detectionLockRef.current, hasProduct: !!productData });
      return;
    }

    detectionLockRef.current = true;

    try {
      // Stop scanner
      const Quagga = (window as any).Quagga;
      if (Quagga) {
        try {
          Quagga.stop();
          console.log('[BarcodeScanner] Scanner stopped');
        } catch (stopErr) {
          console.warn('[BarcodeScanner] Scanner stop error (ignored):', stopErr);
        }
      }

      setIsLoading(true);
      console.log('[BarcodeScanner] Looking up barcode:', barcode);

      // Set a timeout for the entire operation
      const fetchTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Product fetch timeout')), 15000)
      );

      const fetchPromise = fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'FrigAI/1.0 (+https://frigyai.app)',
          },
        }
      );

      const response = await Promise.race([fetchPromise, fetchTimeout]);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[BarcodeScanner] API Response:', data);

      if (data.status === 1 && data.product) {
        const p = data.product;
        const servingSize = p.serving_quantity || 100;
        const multiplier = servingSize / 100;
        const nutriments = p.nutriments || {};

        const nutritionInfo: NutritionInfo = {
          name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
          calories: Math.round((nutriments['energy-kcal_100g'] || 0) * multiplier),
          protein: Math.round((nutriments.proteins_100g || 0) * multiplier),
          carbs: Math.round((nutriments.carbohydrates_100g || 0) * multiplier),
          fat: Math.round((nutriments.fat_100g || 0) * multiplier),
          image: p.image_front_small_url || p.image_url,
          brand: p.brands,
          barcode: barcode,
        };

        console.log('[BarcodeScanner] Product found:', nutritionInfo);
        setProductData(nutritionInfo);
        onFoodScanned(nutritionInfo);
        toast({
          title: '✅ Produkt erkannt!',
          description: `${nutritionInfo.name} - ${nutritionInfo.calories} kcal`,
        });
      } else {
        console.warn('[BarcodeScanner] Product not found for barcode:', barcode);
        toast({
          title: '❌ Produkt nicht gefunden',
          description: 'Dieser Barcode existiert nicht in der Datenbank',
          variant: 'destructive',
        });

        // Resume scanning if product not found
        const Quagga = (window as any).Quagga;
        if (Quagga) {
          try {
            Quagga.start();
            console.log('[BarcodeScanner] Scanner resumed after failed lookup');
          } catch (resumeErr) {
            console.warn('[BarcodeScanner] Scanner resume error (ignored):', resumeErr);
          }
        }
        detectionLockRef.current = false;
      }
    } catch (err: any) {
      console.error('[BarcodeScanner] Error:', err);
      toast({
        title: '⚠️ Fehler',
        description: err.message || 'Fehler beim Abrufen der Produktdaten',
        variant: 'destructive',
      });

      // Resume scanning on error
      const Quagga = (window as any).Quagga;
      if (Quagga) {
        try {
          Quagga.start();
          console.log('[BarcodeScanner] Scanner resumed after error');
        } catch (resumeErr) {
          console.warn('[BarcodeScanner] Scanner resume error (ignored):', resumeErr);
        }
      }
      detectionLockRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAnother = async () => {
    detectionLockRef.current = false;
    setProductData(null);
    const Quagga = (window as any).Quagga;
    if (Quagga) {
      try {
        Quagga.start();
        setIsScannerActive(true);
        console.log('[BarcodeScanner] Scanner restarted for next scan');
      } catch (resumeErr) {
        console.warn('[BarcodeScanner] Scanner resume error:', resumeErr);
        // Try to restart scanner if resume fails
        await startScanner();
      }
    }
  };

  const handleClose = () => {
    stopScanner();
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
              <ShoppingCart className="h-6 w-6 text-lime-400" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-lg">📦 Barcode scannen</h2>
              <p className="text-lime-400/80 text-[10px] font-medium">
                🎯 Produkt erfassen
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

        {/* Scanner Container */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pt-16">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 px-6 z-20"
            >
              <AlertCircle className="h-20 w-20 text-destructive mx-auto" />
              <div>
                <p className="text-white text-base font-semibold mb-2">Fehler</p>
                <p className="text-white/70 text-sm">{error}</p>
              </div>
              <Button onClick={handleClose} className="bg-lime-500 hover:bg-lime-600 text-black font-bold">
                Schließen
              </Button>
            </motion.div>
          ) : productData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 z-20 space-y-4"
            >
              {productData.image && (
                <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={productData.image}
                    alt={productData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">{productData.name}</h3>
                {productData.brand && (
                  <p className="text-sm text-gray-600">
                    <b>Marke:</b> {productData.brand}
                  </p>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-black">
                <p className="text-sm">
                  <b>Kalorien:</b> {productData.calories} kcal
                </p>
                <p className="text-sm">
                  <b>Protein:</b> {productData.protein}g
                </p>
                <p className="text-sm">
                  <b>Kohlenhydrate:</b> {productData.carbs}g
                </p>
                <p className="text-sm">
                  <b>Fett:</b> {productData.fat}g
                </p>
              </div>
              <Button
                onClick={handleScanAnother}
                className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold"
              >
                🔄 Neues Produkt scannen
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Scanner Video Area */}
              <div
                id="barcode-reader"
                className="absolute inset-0 w-full h-full overflow-hidden"
              >
                <style>{`
                  #barcode-reader {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  #barcode-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    display: block !important;
                  }
                  #barcode-reader canvas {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    display: block !important;
                  }
                `}</style>
              </div>
              
              {/* Scan Box Overlay */}
              {isScannerActive && !isLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Scan Frame */}
                  <div className="relative w-64 h-32">
                    <div 
                      className="absolute inset-0 border-4 border-lime-400 rounded-lg"
                      style={{
                        boxShadow: '0 0 20px rgba(132, 255, 136, 0.8), inset 0 0 20px rgba(132, 255, 136, 0.2)',
                      }}
                    />
                    
                    {/* Corner brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-lime-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-lime-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-lime-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-lime-400" />
                    
                    {/* Animated scan line */}
                    <motion.div
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-lime-400 to-transparent"
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        boxShadow: '0 0 15px rgba(132, 255, 136, 1)',
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20"
                >
                  <Loader2 className="h-16 w-16 text-lime-400 animate-spin mb-4" />
                  <p className="text-white font-semibold">Produkt wird geladen...</p>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        {!productData && !error && isScannerActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/98 via-black/80 to-transparent text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-lime-400 text-sm font-semibold">
              🎯 Kamera bereit - Barcode scannen
            </p>
            <p className="text-white/60 text-xs mt-1">
              Halte den Barcode ins Sichtfeld
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
