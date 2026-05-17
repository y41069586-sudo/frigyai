import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { memo, useMemo } from "react";

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
  const addSteps = () => {
    toast({
      title: "Schritte",
      description: healthSyncProvider
        ? `Mit ${healthSyncProvider === "apple" ? "Apple Health" : "Google Fit"} verbunden.`
        : "Verbinde Apple Health oder Google Fit, damit Schritte automatisch synchronisiert werden.",
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
          onClick={(e) => { e.stopPropagation(); addSteps(); }}
          className="flex h-9 w-full min-w-0 items-center justify-center rounded-2xl border-2 border-emerald-200 bg-white/45 px-1 text-[9px] font-medium leading-none whitespace-nowrap text-foreground transition-colors active:bg-emerald-50"
        >
          <span className="whitespace-nowrap">Schritte&nbsp;hinzufügen</span>
        </motion.button>
      </div>
    </motion.div>
  );
});
