import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type QuaggaApi = typeof import('@ericblade/quagga2').default;

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
  const quaggaRef = useRef<QuaggaApi | null>(null);
  const detectionLockRef = useRef(false);
  const detectionHandlerRef = useRef<((data: any) => void) | null>(null);

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
      const Quagga = quaggaRef.current;
      if (Quagga && quaggaRef.current) {
        // Remove the detection handler
        if (detectionHandlerRef.current && Quagga.offDetected) {
          Quagga.offDetected(detectionHandlerRef.current);
          detectionHandlerRef.current = null;
        }
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

      const Quagga = (await import('@ericblade/quagga2')).default;
      if (!Quagga) {
        console.error('[BarcodeScanner] Quagga2 failed to load');
        setError('❌ Barcode-Scanner konnte nicht geladen werden');
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
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
              area: {
                top: '0%',
                left: '0%',
                right: '0%',
                bottom: '0%',
              },
            },
            locator: {
              patchSize: 'large',
              halfSample: true,
            },
            locate: true,
            numOfWorkers: Math.min(2, navigator.hardwareConcurrency || 1),
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
      const detectionHandler = (data: any) => {
        if (data?.codeResult?.code) {
          console.log('[BarcodeScanner] Barcode detected:', data.codeResult.code);
          handleBarcodeDetected(data.codeResult.code);
        }
      };
      detectionHandlerRef.current = detectionHandler;
      Quagga.onDetected(detectionHandler);

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
      const Quagga = quaggaRef.current;
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
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
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
        const Quagga = quaggaRef.current;
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
      const Quagga = quaggaRef.current;
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
    const Quagga = quaggaRef.current;
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-3 top-3 z-10 flex justify-end pt-[env(safe-area-inset-top,0px)]"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-11 w-11 rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-white/20"
            aria-label="Scanner schließen"
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* Scanner Container */}
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
              <style>{`
                #barcode-reader {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  overflow: hidden !important;
                }
                #barcode-reader video {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: cover !important;
                  display: block !important;
                }
                #barcode-reader canvas {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: cover !important;
                  display: block !important;
                }
              `}</style>
              <div
                id="barcode-reader"
                className="absolute inset-0 w-full h-full overflow-hidden"
              />
              
              {isScannerActive && !isLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="relative h-32 w-[82vw] max-w-[360px] rounded-xl">
                    <div 
                      className="absolute inset-0 rounded-xl border-4 border-lime-400"
                      style={{
                        boxShadow: '0 0 20px rgba(132, 255, 136, 0.8), inset 0 0 20px rgba(132, 255, 136, 0.2)',
                      }}
                    />
                    
                    <div className="absolute top-2 left-2 h-5 w-5 border-l-2 border-t-2 border-lime-400" />
                    <div className="absolute top-2 right-2 h-5 w-5 border-r-2 border-t-2 border-lime-400" />
                    <div className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-lime-400" />
                    <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-lime-400" />
                    
                    <motion.div
                      className="absolute inset-x-3 h-1 rounded-full bg-gradient-to-r from-transparent via-lime-300 to-transparent"
                      initial={{ y: 12 }}
                      animate={{ y: 112 }}
                      transition={{ duration: 1.35, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
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

      </motion.div>
    </AnimatePresence>
  );
};
