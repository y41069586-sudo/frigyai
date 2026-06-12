import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { notifyOverlayOpen } from '@/lib/overlayEvents';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
  const watchdogTimerRef = useRef<number | null>(null);
  const lastDetectedCodeRef = useRef<string | null>(null);
  const lastDetectedHitsRef = useRef(0);
  const healthFailCountRef = useRef(0);
  const recoverInFlightRef = useRef(false);
  const productDataRef = useRef(productData);
  const isLoadingRef = useRef(false);
  const startScannerRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});

  useEffect(() => {
    productDataRef.current = productData;
  }, [productData]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

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

  const pauseScanner = useCallback(() => {
    const Quagga = quaggaRef.current;
    if (!Quagga) return;
    try {
      Quagga.stop();
    } catch (stopErr) {
      console.warn('[BarcodeScanner] Scanner pause error (ignored):', stopErr);
    }
  }, []);

  const resumeScanner = useCallback(async () => {
    const Quagga = quaggaRef.current;
    if (!Quagga || !isOpenRef.current) return false;
    try {
      Quagga.start();
      window.setTimeout(prepareMobileVideo, 80);
      setIsScannerActive(true);
      return true;
    } catch (resumeErr) {
      console.warn('[BarcodeScanner] Scanner resume error:', resumeErr);
      return false;
    }
  }, [prepareMobileVideo]);

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
      if (watchdogTimerRef.current != null) {
        window.clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    } catch (err) {
      console.error('[BarcodeScanner] Unexpected error in stopScanner:', err);
      setIsScannerActive(false);
      setIsLoading(false);
      lastDetectedCodeRef.current = null;
      lastDetectedHitsRef.current = 0;
      if (watchdogTimerRef.current != null) {
        window.clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
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
      pauseScanner();
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
        const productName = String(p.product_name_de || p.product_name || '').trim();
        const isPowder =
          /\b(kakaopulver|kakao|cocoa|pulver|powder|backpulver|matcha)\b/i.test(productName) &&
          !/\b(getränk|drink|milch|milk|saft|juice)\b/i.test(productName);
        let servingSize = Number(p.serving_quantity) || 0;
        if (servingSize <= 0 || servingSize > 250) {
          servingSize = isPowder ? 8 : 100;
        } else if (isPowder && servingSize >= 40) {
          servingSize = 8;
        }
        const multiplier = servingSize / 100;
        const nutriments = p.nutriments || {};

        const displayName = isPowder && /\bkakao\b/i.test(productName)
          ? 'Kakaopulver (1 EL)'
          : (productName || t.barcodeUnknownProduct);

        const nutritionInfo: NutritionInfo = {
          name: displayName,
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
          title: `✅ ${t.barcodeProductRecognized}`,
          description: `${nutritionInfo.name} - ${nutritionInfo.calories} kcal`,
        });
          void onFoodScanned(nutritionInfo);
      } else {
        toast({
          title: `❌ ${t.barcodeProductNotFound}`,
          description: t.barcodeNotInDatabase,
          variant: 'destructive',
        });

          detectionLockRef.current = false;
          if (isOpenRef.current) {
            const resumed = await resumeScanner();
            if (!resumed) await startScannerRef.current({ silent: true });
          }
      }
    } catch (err: any) {
      console.error('[BarcodeScanner] Error:', err);
      toast({
        title: t.error,
        description: err.message || t.barcodeFetchError,
        variant: 'destructive',
      });

        detectionLockRef.current = false;
        if (isOpenRef.current) {
          const resumed = await resumeScanner();
          if (!resumed) await startScannerRef.current({ silent: true });
        }
    } finally {
        setIsLoading(false);
      }
    },
    [onFoodScanned, pauseScanner, productData, resumeScanner, t],
  );

  const startScanner = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const generation = ++startGenerationRef.current;

    try {
      setError(null);
      setIsScannerActive(false);
      setIsLoading(false);
      detectionLockRef.current = false;
      lastDetectedCodeRef.current = null;
      lastDetectedHitsRef.current = 0;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(`❌ ${t.barcodeNoCameraSupport}`);
        return;
      }

      if (!window.isSecureContext) {
        setError(`❌ ${t.barcodeNeedsHttps}`);
        return;
      }

      const reader = await waitForReader(() => readerRef.current);
      if (!reader || generation !== startGenerationRef.current || !isOpenRef.current) {
        if (isOpenRef.current && !silent) setError(`❌ ${t.barcodeScannerOpenFailed}`);
        return;
      }

      reader.innerHTML = '';

      const Quagga = (await import('@ericblade/quagga2')).default;
      if (!Quagga || generation !== startGenerationRef.current || !isOpenRef.current) {
        if (!silent) setError(`❌ ${t.barcodeScannerLoadFailed}`);
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
            locate: false,
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
      healthFailCountRef.current = 0;

      if (watchdogTimerRef.current != null) {
        window.clearInterval(watchdogTimerRef.current);
      }
      watchdogTimerRef.current = window.setInterval(() => {
        if (
          !isOpenRef.current ||
          !readerRef.current ||
          detectionLockRef.current ||
          productDataRef.current ||
          isLoadingRef.current
        ) {
          return;
        }
        const video = readerRef.current.querySelector('video') as HTMLVideoElement | null;
        if (!video) return;

        const streamLive = video.srcObject instanceof MediaStream
          ? video.srcObject.getVideoTracks().some((track) => track.readyState === 'live')
          : true;

        const needsNudge =
          video.videoWidth < 1 ||
          video.readyState < 2 ||
          !streamLive ||
          (video.paused && document.visibilityState === 'visible');

        if (needsNudge) {
          healthFailCountRef.current += 1;
          void video.play().catch(() => undefined);
          prepareMobileVideo();
          if (healthFailCountRef.current >= 8 && !recoverInFlightRef.current) {
            recoverInFlightRef.current = true;
            healthFailCountRef.current = 0;
            void (async () => {
              try {
                await stopScanner();
                if (isOpenRef.current) await startScannerRef.current({ silent: true });
              } catch (recoverErr) {
                console.warn('[BarcodeScanner] Silent recover failed:', recoverErr);
              } finally {
                recoverInFlightRef.current = false;
              }
            })();
          }
          return;
        }

        healthFailCountRef.current = 0;
      }, 3000);
    } catch (err: unknown) {
      if (generation !== startGenerationRef.current) return;

      console.error('[BarcodeScanner] Scanner init error:', err);
      if (silent) return;

      let errorMsg = `❌ ${t.barcodeCameraStartFailed}`;
      const errorName = `${(err as Error)?.name ?? ''} ${(err as Error)?.message ?? ''}`;
      if (errorName.includes('NotAllowedError') || errorName.includes('PermissionDeniedError')) {
        errorMsg = `❌ ${t.barcodeCameraDenied}`;
      } else if (errorName.includes('NotFoundError') || errorName.includes('DevicesNotFoundError')) {
        errorMsg = `❌ ${t.barcodeCameraNotFound}`;
      } else if (errorName.includes('NotReadableError') || errorName.includes('TrackStartError')) {
        errorMsg = `❌ ${t.barcodeCameraInUse}`;
      } else if (errorName.includes('NotSupportedError') || errorName.includes('SecurityError')) {
        errorMsg = `❌ ${t.barcodeCameraHttpsRequired}`;
      } else if (errorName.includes('timeout')) {
        errorMsg = `❌ ${t.barcodeCameraInitSlow}`;
      }

      setError(errorMsg);
      setIsScannerActive(false);
    }
  }, [handleBarcodeDetected, prepareMobileVideo, stopScanner, t]);

  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    if (!isOpen) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isOpenRef.current) {
        window.setTimeout(() => prepareMobileVideo(), 120);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isOpen, prepareMobileVideo]);

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
    setIsLoading(false);
    const resumed = await resumeScanner();
    if (!resumed) await startScanner();
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
            aria-label={t.ariaCloseScanner}
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
                <p className="mb-2 text-base font-semibold text-white">{t.error}</p>
                <p className="text-sm text-white/70">{error}</p>
              </div>
              <Button onClick={handleClose} className="bg-[#75FBB2] font-bold text-[#082013] hover:bg-[#57EE9A]">
                {t.close}
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
                    <b>{t.barcodeBrandLabel}</b> {productData.brand}
                  </p>
                )}
              </div>
              <div className="space-y-2 rounded-lg bg-gray-100 p-4 text-black">
                <p className="text-sm">
                  <b>{t.barcodeCaloriesLabel}</b> {productData.calories} kcal
                </p>
                <p className="text-sm">
                  <b>{t.barcodeProteinLabel}</b> {productData.protein}g
                </p>
                <p className="text-sm">
                  <b>{t.barcodeCarbsLabel}</b> {productData.carbs}g
                </p>
                <p className="text-sm">
                  <b>{t.barcodeFatLabel}</b> {productData.fat}g
                </p>
              </div>
              <Button
                onClick={handleScanAnother}
                className="w-full bg-[#75FBB2] font-bold text-[#082013] hover:bg-[#57EE9A]"
              >
                🔄 {t.barcodeScanNewProduct}
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
                  opacity: 0 !important;
                  pointer-events: none !important;
                }
              `}</style>
          <div id="barcode-reader" ref={readerRef} className="absolute inset-0 h-full w-full overflow-hidden" />

          {showScanner && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
              <style>{`
                @keyframes barcode-scan-sweep {
                  0%, 100% { top: 10%; }
                  50% { top: 86%; }
                }
                @keyframes barcode-scan-glow-sweep {
                  0%, 100% { top: 10%; opacity: 0.35; }
                  50% { top: 86%; opacity: 0.75; }
                }
                @keyframes barcode-frame-pulse {
                  0%, 100% { box-shadow: inset 0 0 0 1px rgba(117,251,178,0.28); }
                  50% { box-shadow: inset 0 0 0 1px rgba(117,251,178,0.55); }
                }
                .barcode-scan-line {
                  position: absolute;
                  left: 12px;
                  right: 12px;
                  height: 2px;
                  border-radius: 9999px;
                  background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(117, 251, 178, 0.55) 12%,
                    #75fbb2 50%,
                    rgba(117, 251, 178, 0.55) 88%,
                    transparent 100%
                  );
                  box-shadow:
                    0 0 6px 1px rgba(117, 251, 178, 0.95),
                    0 0 16px 3px rgba(117, 251, 178, 0.45),
                    0 0 28px 6px rgba(117, 251, 178, 0.2);
                  animation: barcode-scan-sweep 2.1s ease-in-out infinite;
                  will-change: top;
                }
                .barcode-scan-glow {
                  position: absolute;
                  left: 12px;
                  right: 12px;
                  height: 36px;
                  margin-top: -17px;
                  border-radius: 9999px;
                  background: linear-gradient(
                    to bottom,
                    transparent,
                    rgba(117, 251, 178, 0.22) 45%,
                    rgba(117, 251, 178, 0.38) 50%,
                    rgba(117, 251, 178, 0.22) 55%,
                    transparent
                  );
                  filter: blur(1px);
                  animation: barcode-scan-glow-sweep 2.1s ease-in-out infinite;
                  will-change: top, opacity;
                  pointer-events: none;
                }
                .barcode-frame-pulse {
                  animation: barcode-frame-pulse 2.4s ease-in-out infinite;
                }
              `}</style>
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                  width: "min(94vw, 400px)",
                  height: "min(44vw, 196px)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.52)" }}
                />

                <div className="absolute inset-0 rounded-2xl barcode-frame-pulse" />

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

                <div className="barcode-scan-glow" aria-hidden />
                <div className="barcode-scan-line" aria-hidden />
              </div>

              <p className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] px-6 text-center text-sm font-medium text-white/90">
                {t.barcodeHoldInFrame}
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
              <p className="font-semibold text-white">{t.barcodeLoadingProduct}</p>
                </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
