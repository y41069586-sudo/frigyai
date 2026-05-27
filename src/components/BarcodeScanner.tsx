import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { notifyOverlayOpen } from '@/lib/overlayEvents';

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

async function waitForReader(
  getEl: () => HTMLDivElement | null,
  maxMs = 2500,
): Promise<HTMLDivElement | null> {
  const start = performance.now();
  while (performance.now() - start < maxMs) {
    const el = getEl();
    if (el) return el;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return getEl();
}

export const BarcodeScanner = ({ isOpen, onClose, onFoodScanned }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<NutritionInfo | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const quaggaRef = useRef<QuaggaApi | null>(null);
  const detectionLockRef = useRef(false);
  const detectionHandlerRef = useRef<((data: any) => void) | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const startGenerationRef = useRef(0);
  const isOpenRef = useRef(isOpen);
  const lastDetectedCodeRef = useRef<string | null>(null);
  const lastDetectedHitsRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
    notifyOverlayOpen(isOpen);
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
    video.controls = false;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('disablePictureInPicture', 'true');
    video.setAttribute('controlsList', 'nodownload nofullscreen noplaybackrate');
    video.removeAttribute('controls');
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
      setIsLoading(false);
      lastDetectedCodeRef.current = null;
      lastDetectedHitsRef.current = 0;
    } catch (err) {
      console.error('[BarcodeScanner] Unexpected error in stopScanner:', err);
      setIsScannerActive(false);
      setIsLoading(false);
      lastDetectedCodeRef.current = null;
      lastDetectedHitsRef.current = 0;
    }
  }, []);

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      const normalizedBarcode = String(barcode || '').replace(/\s+/g, '').trim();
      if (!normalizedBarcode || normalizedBarcode.length < 8 || detectionLockRef.current || productData) return;

      if (lastDetectedCodeRef.current === normalizedBarcode) {
        lastDetectedHitsRef.current += 1;
      } else {
        lastDetectedCodeRef.current = normalizedBarcode;
        lastDetectedHitsRef.current = 1;
      }
      if (lastDetectedHitsRef.current < 2) return;

    detectionLockRef.current = true;
    lastDetectedCodeRef.current = null;
    lastDetectedHitsRef.current = 0;

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
          `https://world.openfoodfacts.org/api/v0/product/${normalizedBarcode}.json`,
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
          barcode: normalizedBarcode,
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
      detectionLockRef.current = false;
      lastDetectedCodeRef.current = null;
      lastDetectedHitsRef.current = 0;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('❌ Dein Browser unterstützt keinen Kamera-Zugriff');
        return;
      }

      if (!window.isSecureContext) {
        setError('❌ Kamera braucht HTTPS. Öffne die App über localhost, HTTPS oder als installierte App.');
        return;
      }

      const reader = await waitForReader(() => readerRef.current);
      if (!reader || generation !== startGenerationRef.current || !isOpenRef.current) {
        if (isOpenRef.current) setError('❌ Scanner konnte nicht geöffnet werden');
        return;
      }

      reader.innerHTML = '';

      const Quagga = (await import('@ericblade/quagga2')).default;
      if (!Quagga || generation !== startGenerationRef.current || !isOpenRef.current) {
        setError('❌ Barcode-Scanner konnte nicht geladen werden');
        return;
      }

      quaggaRef.current = Quagga;

      await new Promise<void>((resolve, reject) => {
        const initTimeout = window.setTimeout(() => {
          reject(new Error('Quagga initialization timeout'));
        }, 12000);

        Quagga.init(
          {
            frequency: 18,
            inputStream: {
              type: 'LiveStream',
              target: reader,
              constraints: {
                facingMode: { ideal: 'environment' },
                width: { min: 480, ideal: 1280, max: 1920 },
                height: { min: 360, ideal: 720, max: 1080 },
              },
              area: { top: '28%', right: '4%', bottom: '28%', left: '4%' },
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
    detectionLockRef.current = false;
    lastDetectedCodeRef.current = null;
    lastDetectedHitsRef.current = 0;

    void startScanner();

    return () => {
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
        className="fixed inset-0 z-[130] flex flex-col bg-black"
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
              <Button onClick={handleClose} className="bg-[#75FBB2] font-bold text-[#082013] hover:bg-[#57EE9A]">
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
                className="w-full bg-[#75FBB2] font-bold text-[#082013] hover:bg-[#57EE9A]"
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
              opacity: ${showScanner && isScannerActive ? 1 : 0};
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
            #barcode-reader video::-webkit-media-controls-play-button,
            #barcode-reader video::-webkit-media-controls-start-playback-button,
            #barcode-reader video::-webkit-media-controls-overlay-play-button,
            #barcode-reader video::-webkit-media-controls-overlay-enclosure {
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
              <style>{`
                @keyframes barcode-scan-line {
                  0% { top: 10%; opacity: 0.6; }
                  50% { top: 86%; opacity: 1; }
                  100% { top: 10%; opacity: 0.6; }
                }
                @keyframes barcode-scan-glow {
                  0% { top: 8%; opacity: 0.25; }
                  50% { top: 84%; opacity: 0.5; }
                  100% { top: 8%; opacity: 0.25; }
                }
                @keyframes barcode-frame-pulse {
                  0%, 100% { box-shadow: 0 0 10px 0 rgba(117,251,178,0.22); }
                  50% { box-shadow: 0 0 22px 3px rgba(117,251,178,0.38); }
                }
                .barcode-scan-line {
                  animation: barcode-scan-line 2s ease-in-out infinite;
                  will-change: top, opacity;
                }
                .barcode-scan-glow {
                  animation: barcode-scan-glow 2s ease-in-out infinite;
                  will-change: top, opacity;
                }
                .barcode-frame-pulse {
                  animation: barcode-frame-pulse 1.8s ease-in-out infinite;
                }
              `}</style>
              <div
                className="relative rounded-2xl"
                style={{
                  width: "min(94vw, 400px)",
                  height: "min(44vw, 196px)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.52)" }}
                />

                <div className="absolute inset-0 rounded-2xl border border-[#75FBB2]/40 barcode-frame-pulse" />

                {(
                  [
                    "left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-xl",
                    "right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-xl",
                    "left-0 bottom-0 border-l-[3px] border-b-[3px] rounded-bl-xl",
                    "right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-xl",
                  ] as const
                ).map((cornerClass) => (
                  <div
                    key={cornerClass}
                    className={`absolute h-8 w-8 border-[#75FBB2] ${cornerClass}`}
                  />
                ))}

                <div
                  className="barcode-scan-line absolute left-3 right-3 h-[2px] rounded-full bg-[#75FBB2]"
                  style={{
                    boxShadow:
                      "0 0 8px 2px rgba(117,251,178,0.85), 0 0 18px 3px rgba(117,251,178,0.28)",
                  }}
                />

                <div className="barcode-scan-glow absolute left-3 right-3 h-10 rounded-full bg-gradient-to-b from-[#75FBB2]/25 to-transparent blur-[2px]" />
              </div>

              <p className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] px-6 text-center text-sm font-medium text-white/90">
                Barcode in den Rahmen halten
              </p>
            </div>
          )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75"
                >
              <Loader2 className="mb-4 h-16 w-16 animate-spin text-[#75FBB2]" />
              <p className="font-semibold text-white">Produkt wird geladen…</p>
                </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
