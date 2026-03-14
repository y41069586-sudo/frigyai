import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<NutritionInfo | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setProductData(null);
    setIsLoading(false);
    setIsScannerActive(false);

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (stopErr: any) {
          // Ignore "not running" errors - scanner might already be stopped
          if (!stopErr.message?.includes('not running')) {
            console.warn('Error stopping scanner:', stopErr);
          }
        }
        try {
          scannerRef.current.clear();
        } catch (clearErr) {
          console.warn('Error clearing scanner:', clearErr);
        }
        scannerRef.current = null;
      }
      setIsScannerActive(false);
    } catch (err) {
      console.error('Unexpected error in stopScanner:', err);
      setIsScannerActive(false);
    }
  };

  const startScanner = async () => {
    try {
      setError(null);
      setIsScannerActive(false);

      // Check if cameras are available
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        setError('❌ Keine Kamera gefunden!');
        return;
      }

      // Initialize scanner
      scannerRef.current = new Html5Qrcode('barcode-reader', false);

      // Start scanning
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 120 },
        },
        async (barcode) => {
          await handleBarcodeDetected(barcode);
        },
        (err) => {
          console.warn('Scanner error:', err);
        }
      );

      setIsScannerActive(true);
    } catch (err: any) {
      console.error('Scanner init error:', err);
      
      let errorMsg = '❌ Kamera konnte nicht gestartet werden';
      if (err.message?.includes('NotAllowedError')) {
        errorMsg = '❌ Kamera-Zugriff verweigert!';
      } else if (err.message?.includes('NotFoundError')) {
        errorMsg = '❌ Keine Kamera gefunden!';
      } else if (err.message?.includes('NotReadableError')) {
        errorMsg = '❌ Kamera wird bereits verwendet!';
      }
      
      setError(errorMsg);
      setIsScannerActive(false);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || isLoading || productData) return;

    try {
      // Pause scanner (ignore errors if already paused)
      if (scannerRef.current) {
        try {
          await scannerRef.current.pause();
        } catch (pauseErr) {
          console.warn('Scanner pause error (ignored):', pauseErr);
        }
      }

      setIsLoading(true);
      console.log('[BarcodeScanner] Looking up:', barcode);

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'FrigAI/1.0 (+https://frigyai.app)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

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

        setProductData(nutritionInfo);
        onFoodScanned(nutritionInfo);
        toast({
          title: '✅ Produkt erkannt!',
          description: `${nutritionInfo.name} - ${nutritionInfo.calories} kcal`,
        });
      } else {
        toast({
          title: '❌ Produkt nicht gefunden',
          description: 'Dieser Barcode existiert nicht in der Datenbank',
          variant: 'destructive',
        });

        // Resume scanning if product not found
        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch (resumeErr) {
            console.warn('Scanner resume error (ignored):', resumeErr);
          }
        }
      }
    } catch (err: any) {
      console.error('[BarcodeScanner] Error:', err);
      toast({
        title: '⚠️ Fehler',
        description: err.message || 'Fehler beim Abrufen der Produktdaten',
        variant: 'destructive',
      });

      // Resume scanning on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.resume();
        } catch (resumeErr) {
          console.warn('Scanner resume error (ignored):', resumeErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAnother = async () => {
    setProductData(null);
    if (scannerRef.current) {
      try {
        await scannerRef.current.resume();
      } catch (resumeErr) {
        console.warn('Scanner resume error:', resumeErr);
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
              <div id="barcode-reader" className="w-full h-full relative flex items-center justify-center" />
              
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
