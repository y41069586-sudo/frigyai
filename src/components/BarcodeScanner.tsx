import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
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

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<NutritionInfo | null>(null);

  useEffect(() => {
    if (!isOpen || !readerRef.current) return;

    setError(null);
    setProductData(null);
    setIsLoading(false);

    // Initialize scanner
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (err) => {
        console.warn('Scanner error:', err);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleScanSuccess = async (barcode: string) => {
    if (!barcode || isLoading || productData) return;

    setIsLoading(true);
    
    try {
      // Stop scanning while fetching
      if (scannerRef.current) {
        await scannerRef.current.pause();
      }

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
          brand: p.brands || p.brand,
          servingSize: p.serving_size || `${servingSize}g`,
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
          await scannerRef.current.resume();
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
        await scannerRef.current.resume();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAnother = async () => {
    setProductData(null);
    if (scannerRef.current) {
      await scannerRef.current.resume();
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
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
              <ShoppingCart className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-lg">Barcode Scan</h2>
              <p className="text-primary/80 text-[10px] font-medium">
                📱 Scan your product
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
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pt-16">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 px-6 z-20"
            >
              <AlertCircle className="h-20 w-20 text-destructive mx-auto" />
              <div>
                <p className="text-white text-base font-semibold mb-2">Error</p>
                <p className="text-white/70 text-sm">{error}</p>
              </div>
              <Button onClick={handleClose} className="bg-primary hover:bg-primary/90 text-black font-bold">
                Close
              </Button>
            </motion.div>
          ) : productData && isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 pt-16"
            >
              <Loader2 className="h-20 w-20 text-primary animate-spin" />
              <p className="text-white text-lg font-semibold">Loading product...</p>
            </motion.div>
          ) : productData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 z-20 space-y-4"
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
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{productData.name}</h3>
                {productData.brand && (
                  <p className="text-sm text-gray-600">
                    <b>Brand:</b> {productData.brand}
                  </p>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <b>Calories:</b> {productData.calories} kcal
                </p>
                <p className="text-sm">
                  <b>Protein:</b> {productData.protein}g
                </p>
                <p className="text-sm">
                  <b>Carbs:</b> {productData.carbs}g
                </p>
                <p className="text-sm">
                  <b>Fat:</b> {productData.fat}g
                </p>
              </div>
              <Button
                onClick={handleScanAnother}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
              >
                🔄 Scan Another Product
              </Button>
            </motion.div>
          ) : (
            <div id="qr-reader" className="w-full h-full" />
          )}
        </div>

        {/* Footer Info */}
        {!productData && !error && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/98 via-black/80 to-transparent text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-white/60 text-sm">
              🎯 Point camera at barcode to scan product
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
