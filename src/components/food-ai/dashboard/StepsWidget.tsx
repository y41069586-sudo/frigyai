import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { memo, useMemo } from "react";
import { useHealthConnect } from "@/hooks/useHealthConnect";

type StepsWidgetProps = {
  steps: number;
  goal?: number;
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

export const StepsWidget = memo(function StepsWidget({
  steps,
  goal = 10_000,
  delay = 0,
  onToggleExpand,
}: StepsWidgetProps) {
  const { isNativeApp, platform, isConnected, isLoading, requestPermissions, syncHealthData } = useHealthConnect();
  const healthSyncProvider = useMemo(() => {
    try {
      const raw = localStorage.getItem("onboardingUserData") || localStorage.getItem("userProfile");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { healthSync?: string | null };
      return parsed.healthSync || null;
    } catch {
      return null;
    }
  }, []);
  const providerName = useMemo(() => {
    if (platform === "ios") return "Apple Health";
    if (platform === "android") return "Google Fit / Health Connect";
    if (healthSyncProvider === "apple" || healthSyncProvider === "apple-health") return "Apple Health";
    if (healthSyncProvider === "google") return "Google Fit";
    if (healthSyncProvider === "health-connect") return "Health Connect";
    return "Health Sync";
  }, [healthSyncProvider, platform]);

  const addSteps = async () => {
    if (isLoading) return;

    if (isNativeApp) {
      const connected = isConnected || await requestPermissions();
      if (connected) {
        await syncHealthData();
      }
      return;
    }

    toast({
      title: healthSyncProvider ? `${providerName} in der App oeffnen` : "Health Sync nur auf dem Handy",
      description: healthSyncProvider
        ? `Wenn du ${providerName} im Onboarding schon erlaubt hast, funktioniert die Schritte-Synchronisierung direkt in der installierten App. In der Browser-Vorschau koennen keine echten Schritte gelesen werden.`
        : `Tippe auf dem Handy, um ${providerName} zu verbinden und die Schritte zu synchronisieren. In der Browser-Vorschau gibt es dafuer keine Systemfreigabe.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggleExpand}
      className="relative min-h-[185px] min-w-0 w-full overflow-hidden rounded-[1.85rem] border border-primary/25 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70"
    >
      <div className="pointer-events-none absolute inset-x-5 top-10 hidden h-20 rounded-full bg-primary/30 blur-2xl sm:block" />

      <div className="relative z-[10] grid min-h-[185px] grid-rows-[auto_1fr_auto] justify-items-center p-4">
        <div className="justify-self-start flex items-center gap-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[15px] leading-none">👟</span>
          <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.03em] text-foreground">Schritte</h3>
        </div>

        <div className="flex items-center justify-center px-1 py-1 text-center">
          <p className="text-[12px] font-semibold leading-snug tracking-[-0.02em] text-foreground">
            Wie wär’s mit<br />einem kurzen<br />Spaziergang?
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={isLoading}
          onClick={(e) => { e.stopPropagation(); void addSteps(); }}
          className="flex h-9 w-full min-w-0 items-center justify-center rounded-2xl border-2 border-emerald-200 bg-white/45 px-1 text-[9px] font-medium leading-none whitespace-nowrap text-foreground transition-colors active:bg-emerald-50"
        >
          <span className="whitespace-nowrap">{isLoading ? "Synchronisiere..." : "Schritte\u00a0syncen"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
});
