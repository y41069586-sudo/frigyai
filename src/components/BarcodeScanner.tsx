import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Camera, AlertCircle } from "lucide-react";
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

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        async (decodedText) => {
          // Barcode detected
          await handleBarcode(decodedText);
        },
        () => {
          // QR Code scanning in progress
        }
      );
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError("Kamera-Zugriff fehlgeschlagen. Bitte erlaube den Zugriff auf die Kamera.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleBarcode = async (barcode: string) => {
    // Stop scanning while looking up
    await stopScanner();
    setIsLoading(true);

    try {
      // Use OpenFoodFacts API (free, no API key needed)
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        // Extract per 100g values and estimate per serving
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
        onClose();
      } else {
        toast({
          title: "Produkt nicht gefunden",
          description: "Dieser Barcode ist nicht in der Datenbank.",
          variant: "destructive",
        });
        // Restart scanner
        startScanner();
      }
    } catch (err) {
      console.error("Lookup error:", err);
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht abgerufen werden.",
        variant: "destructive",
      });
      startScanner();
    } finally {
      setIsLoading(false);
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
        <div className="flex items-center justify-between p-4 bg-black/80">
          <h2 className="text-white font-semibold text-lg">Barcode scannen</h2>
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
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {error ? (
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-white text-sm">{error}</p>
              <Button onClick={startScanner} variant="outline">
                Erneut versuchen
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
              <p className="text-white text-sm">Produkt wird gesucht...</p>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              {/* Scan Frame */}
              <div className="relative">
                <div
                  id="barcode-reader"
                  ref={containerRef}
                  className="w-full rounded-xl overflow-hidden"
                />
                
                {/* Scan overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-primary"
                    style={{ boxShadow: "0 0 10px rgba(95, 208, 104, 0.8)" }}
                    animate={{ top: ["20%", "80%", "20%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
              
              <p className="text-center text-white/70 text-sm mt-4">
                Halte den Barcode in den Rahmen
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-4 bg-black/80 text-center">
          <p className="text-white/50 text-xs">
            Daten von OpenFoodFacts.org
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
