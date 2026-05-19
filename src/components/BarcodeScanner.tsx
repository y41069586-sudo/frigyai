import { useCallback, useEffect, useRef, useState } from 'react';
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

async function waitForReader(el: HTMLDivElement | null, maxMs = 2500): Promise<HTMLDivElement | null> {
  const start = performance.now();
  while (performance.now() - start < maxMs) {
    if (el) return el;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return el;
}

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<NutritionInfo | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const quaggaRef = useRef<QuaggaApi | null>(null);
  const detectionLockRef = useRef(false);
  const detectionHandlerRef = useRef<((data: any) => void) | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const startGenerationRef = useRef(0);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const prepareMobileVideo = useCallback(() => {
    const video = readerRef.current?.querySelector('video') as HTMLVideoElement | null;
    if (!video) return;

    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('autoplay', 'true');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    void video.play().catch((err) => {
      console.warn('[BarcodeScanner] Mobile video autoplay failed:', err);
    });
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      const Quagga = quaggaRef.current;
      if (Quagga) {
        if (detectionHandlerRef.current && Quagga.offDetected) {
          Quagga.offDetected(detectionHandlerRef.current);
          detectionHandlerRef.current = null;
        }
        try {
          Quagga.stop();
        } catch (stopErr) {
          console.warn('[BarcodeScanner] Error stopping Quagga scanner:', stopErr);
        }
        quaggaRef.current = null;
      }
      setIsScannerActive(false);
      setIsStarting(false);
      setIsLoading(false);
    } catch (err) {
      console.error('[BarcodeScanner] Unexpected error in stopScanner:', err);
      setIsScannerActive(false);
      setIsStarting(false);
      setIsLoading(false);
    }
  }, []);

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      if (!barcode || detectionLockRef.current || productData) return;

      detectionLockRef.current = true;

      try {
        const Quagga = quaggaRef.current;
        if (Quagga) {
          try {
            Quagga.stop();
            setIsScannerActive(false);
          } catch (stopErr) {
            console.warn('[BarcodeScanner] Scanner stop error (ignored):', stopErr);
          }
        }

        setIsLoading(true);

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 9000);

        const response = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
          { signal: controller.signal },
        );
        window.clearTimeout(timeoutId);

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
          toast({
            title: '✅ Produkt erkannt!',
            description: `${nutritionInfo.name} - ${nutritionInfo.calories} kcal`,
          });
          void onFoodScanned(nutritionInfo);
        } else {
          toast({
            title: '❌ Produkt nicht gefunden',
            description: 'Dieser Barcode existiert nicht in der Datenbank',
            variant: 'destructive',
          });

          detectionLockRef.current = false;
          const QuaggaResume = quaggaRef.current;
          if (QuaggaResume && isOpenRef.current) {
            try {
              QuaggaResume.start();
              window.setTimeout(prepareMobileVideo, 80);
              setIsScannerActive(true);
            } catch (resumeErr) {
              console.warn('[BarcodeScanner] Scanner resume error (ignored):', resumeErr);
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

        detectionLockRef.current = false;
        const QuaggaResume = quaggaRef.current;
        if (QuaggaResume && isOpenRef.current) {
          try {
            QuaggaResume.start();
            window.setTimeout(prepareMobileVideo, 80);
            setIsScannerActive(true);
          } catch (resumeErr) {
            console.warn('[BarcodeScanner] Scanner resume error (ignored):', resumeErr);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onFoodScanned, prepareMobileVideo, productData],
  );

  const startScanner = useCallback(async () => {
    const generation = ++startGenerationRef.current;

    try {
      setError(null);
      setIsScannerActive(false);
      setIsLoading(false);
      setIsStarting(true);
      detectionLockRef.current = false;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('❌ Dein Browser unterstützt keinen Kamera-Zugriff');
        setIsStarting(false);
        return;
      }

      if (!window.isSecureContext) {
        setError('❌ Kamera braucht HTTPS. Öffne die App über localhost, HTTPS oder als installierte App.');
        setIsStarting(false);
        return;
      }

      const reader = await waitForReader(readerRef.current);
      if (!reader || generation !== startGenerationRef.current || !isOpenRef.current) {
        if (isOpenRef.current) setError('❌ Scanner konnte nicht geöffnet werden');
        setIsStarting(false);
        return;
      }

      reader.innerHTML = '';

      const Quagga = (await import('@ericblade/quagga2')).default;
      if (!Quagga || generation !== startGenerationRef.current || !isOpenRef.current) {
        setError('❌ Barcode-Scanner konnte nicht geladen werden');
        setIsStarting(false);
        return;
      }

      quaggaRef.current = Quagga;

      await new Promise<void>((resolve, reject) => {
        const initTimeout = window.setTimeout(() => {
          reject(new Error('Quagga initialization timeout'));
        }, 12000);

        Quagga.init(
          {
            frequency: 8,
            inputStream: {
              type: 'LiveStream',
              target: reader,
              constraints: {
                facingMode: { ideal: 'environment' },
                width: { min: 480, ideal: 1280, max: 1920 },
                height: { min: 360, ideal: 720, max: 1080 },
              },
              area: { top: '12%', right: '8%', bottom: '12%', left: '8%' },
            },
            locator: { patchSize: 'medium', halfSample: true },
            locate: true,
            numOfWorkers: 0,
            decoder: {
              readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
            },
          },
          (err: unknown) => {
            window.clearTimeout(initTimeout);
            if (err) reject(err);
            else resolve();
          },
        );
      });

      if (generation !== startGenerationRef.current || !isOpenRef.current) {
        try {
          Quagga.stop();
        } catch {
          /* ignore */
        }
        return;
      }

      Quagga.start();
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      prepareMobileVideo();

      const detectionHandler = (data: { codeResult?: { code?: string } }) => {
        const code = data?.codeResult?.code;
        if (code) void handleBarcodeDetected(code);
      };
      detectionHandlerRef.current = detectionHandler;
      Quagga.onDetected(detectionHandler);

      setIsScannerActive(true);
      setIsStarting(false);
    } catch (err: unknown) {
      if (generation !== startGenerationRef.current) return;

      console.error('[BarcodeScanner] Scanner init error:', err);

      let errorMsg = '❌ Kamera konnte nicht gestartet werden';
      const errorName = `${(err as Error)?.name ?? ''} ${(err as Error)?.message ?? ''}`;
      if (errorName.includes('NotAllowedError') || errorName.includes('PermissionDeniedError')) {
        errorMsg = '❌ Kamera-Zugriff verweigert!';
      } else if (errorName.includes('NotFoundError') || errorName.includes('DevicesNotFoundError')) {
        errorMsg = '❌ Keine Kamera gefunden!';
      } else if (errorName.includes('NotReadableError') || errorName.includes('TrackStartError')) {
        errorMsg = '❌ Kamera wird bereits verwendet!';
      } else if (errorName.includes('NotSupportedError') || errorName.includes('SecurityError')) {
        errorMsg = '❌ Kamera braucht HTTPS oder localhost';
      } else if (errorName.includes('timeout')) {
        errorMsg = '❌ Kamera-Initialisierung zu langsam';
      }

      setError(errorMsg);
      setIsScannerActive(false);
      setIsStarting(false);
    }
  }, [handleBarcodeDetected, prepareMobileVideo]);

  useEffect(() => {
    if (!isOpen) {
      void stopScanner();
      return undefined;
    }

    setError(null);
    setProductData(null);
    setIsLoading(false);
    setIsScannerActive(false);
    setIsStarting(true);
    detectionLockRef.current = false;

    const startTimer = window.setTimeout(() => {
      void startScanner();
    }, 180);

    return () => {
      window.clearTimeout(startTimer);
      void stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  const handleScanAnother = async () => {
    detectionLockRef.current = false;
    setProductData(null);
    const Quagga = quaggaRef.current;
    if (Quagga) {
      try {
        Quagga.start();
        window.setTimeout(prepareMobileVideo, 80);
        setIsScannerActive(true);
      } catch {
        await startScanner();
      }
    } else {
      await startScanner();
    }
  };

  const handleClose = () => {
    void stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  const showScanner = !error && !productData;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black"
      >
        <div className="absolute right-3 top-3 z-30 flex justify-end pt-[env(safe-area-inset-top,0px)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-11 w-11 rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-white/20"
            aria-label="Scanner schließen"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <motion.div
          className="flex flex-1 flex-col items-center justify-center relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-20 space-y-6 px-6 text-center"
            >
              <AlertCircle className="mx-auto h-20 w-20 text-destructive" />
              <div>
                <p className="mb-2 text-base font-semibold text-white">Fehler</p>
                <p className="text-sm text-white/70">{error}</p>
              </div>
              <Button onClick={handleClose} className="bg-lime-500 font-bold text-black hover:bg-lime-600">
                Schließen
              </Button>
            </motion.div>
          ) : productData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-20 mx-4 w-full max-w-sm space-y-4 rounded-xl bg-white p-6"
            >
              {productData.image && (
                <motion.div className="relative h-40 w-full overflow-hidden rounded-lg bg-gray-200">
                  <img
                    src={productData.image}
                    alt={productData.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </motion.div>
              )}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">{productData.name}</h3>
                {productData.brand && (
                  <p className="text-sm text-gray-600">
                    <b>Marke:</b> {productData.brand}
                  </p>
                )}
              </div>
              <div className="space-y-2 rounded-lg bg-gray-100 p-4 text-black">
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
                className="w-full bg-lime-500 font-bold text-black hover:bg-lime-600"
              >
                🔄 Neues Produkt scannen
              </Button>
            </motion.div>
          ) : null}

          {/* Reader mount — always in DOM while open so init finds the target */}
          <style>{`
            #barcode-reader {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              opacity: ${showScanner ? 1 : 0};
              pointer-events: ${showScanner ? 'auto' : 'none'};
            }
            #barcode-reader video {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              display: block !important;
            }
            #barcode-reader video::-webkit-media-controls,
            #barcode-reader video::-webkit-media-controls-panel,
            #barcode-reader video::-webkit-media-controls-play-button {
              display: none !important;
              -webkit-appearance: none !important;
            }
            #barcode-reader canvas {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
          `}</style>
          <div id="barcode-reader" ref={readerRef} className="absolute inset-0 h-full w-full overflow-hidden" />

          {showScanner && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
              {/* Dimmed overlay with cutout feel */}
              <motion.div
                className="absolute inset-0 bg-black/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />

              <div className="relative h-[38vh] w-[min(88vw,360px)]">
                {/* Pulsing frame */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-lime-400/90"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(74, 222, 128, 0.35)',
                      '0 0 28px 4px rgba(74, 222, 128, 0.55)',
                      '0 0 0 0 rgba(74, 222, 128, 0.35)',
                    ],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Corner brackets */}
                {[
                  'top-0 left-0 border-l-[3px] border-t-[3px] rounded-tl-xl',
                  'top-0 right-0 border-r-[3px] border-t-[3px] rounded-tr-xl',
                  'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                  'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
                ].map((cls) => (
                  <motion.div
                    key={cls}
                    className={`absolute h-8 w-8 border-lime-300 ${cls}`}
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}

                {/* Scan line — smooth continuous sweep */}
                <motion.div
                  className="absolute left-3 right-3 h-[3px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(134,239,172,0.2) 15%, rgba(190,242,100,1) 50%, rgba(134,239,172,0.2) 85%, transparent 100%)',
                    boxShadow: '0 0 16px 3px rgba(74, 222, 128, 0.85), 0 0 4px 1px rgba(255,255,255,0.5)',
                  }}
                  animate={{ top: ['8%', '92%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                />

                {/* Soft trail behind scan line */}
                <motion.div
                  className="absolute left-4 right-4 h-10 rounded-full bg-lime-400/10 blur-md"
                  animate={{ top: ['6%', '90%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <motion.p
                className="mt-8 px-6 text-center text-sm font-medium text-white/90"
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {isStarting && !isScannerActive
                  ? 'Kamera wird gestartet…'
                  : 'Barcode in den Rahmen halten'}
              </motion.p>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75"
            >
              <Loader2 className="mb-4 h-16 w-16 animate-spin text-lime-400" />
              <p className="font-semibold text-white">Produkt wird geladen…</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
