import { motion } from "framer-motion";
import { Camera, Loader2, Refrigerator } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

type ScanResultActionsProps = {
  onWeekPlan: () => void;
  onNewPhoto: () => void;
  loading?: boolean;
  planPhase?: "idle" | "planning";
  planningLabel?: string;
};

export function ScanResultActions({
  onWeekPlan,
  onNewPhoto,
  loading,
  planPhase = "idle",
  planningLabel,
}: ScanResultActionsProps) {
  const { t } = useLanguage();
  const planning = !!loading && planPhase === "planning";
  const resolvedPlanningLabel = planningLabel ?? t.scanResultGeneratingPlan;

  return (
    <div className="space-y-3 min-[360px]:space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2 min-[360px]:gap-2.5 sm:gap-3">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={onWeekPlan}
          disabled={!!loading}
          className={cn(
            "group relative w-full text-left overflow-hidden rounded-[1rem] min-[360px]:rounded-[1.2rem] sm:rounded-[1.4rem] p-3 min-[360px]:p-4 sm:p-5 min-h-[96px] min-[360px]:min-h-[104px] sm:min-h-[122px] border border-white/40 bg-gradient-to-br from-primary/15 via-background/90 to-primary/5 shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.45)] backdrop-blur-md",
            loading && "opacity-75",
          )}
        >
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
          <Refrigerator className="h-5 w-5 min-[360px]:h-6 min-[360px]:w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
          <h3 className="text-[13px] min-[360px]:text-sm sm:text-base font-bold text-foreground mb-0.5 sm:mb-1 leading-tight">
            {t.scanResultGeneratePlan}
          </h3>
          <p className="text-[11px] min-[360px]:text-xs sm:text-sm text-muted-foreground leading-tight sm:leading-snug">
            {t.scanResultGeneratePlanDesc}
          </p>
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 min-[360px]:gap-2 sm:gap-3 bg-background/70 backdrop-blur-[2px] rounded-[1rem] min-[360px]:rounded-[1.2rem] sm:rounded-[1.4rem] px-2.5 min-[360px]:px-3 sm:px-4">
              <Loader2 className="h-5 w-5 min-[360px]:h-6 min-[360px]:w-6 sm:h-8 sm:w-8 animate-spin text-primary shrink-0" />
              {planning && <p className="text-[11px] min-[360px]:text-xs sm:text-sm font-medium text-center text-foreground">{resolvedPlanningLabel}</p>}
            </div>
          )}
        </motion.button>

        <Button
          type="button"
          variant="outline"
          onClick={onNewPhoto}
          disabled={!!loading}
          className="h-auto min-h-[96px] min-[360px]:min-h-[104px] sm:min-h-[122px] w-full justify-start items-start rounded-[1rem] min-[360px]:rounded-[1.2rem] sm:rounded-[1.4rem] border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 min-[360px]:px-4 sm:px-5 py-2.5 min-[360px]:py-3 sm:py-4 text-left"
        >
          <span className="flex flex-col">
            <Camera className="mb-1 h-5 w-5 min-[360px]:h-6 min-[360px]:w-6 sm:h-7 sm:w-7 text-primary" />
            <span className="text-[13px] min-[360px]:text-sm sm:text-base font-bold text-foreground">{t.scanResultNewPhoto}</span>
            <span className="mt-0.5 text-[11px] min-[360px]:text-xs sm:text-sm font-normal text-muted-foreground leading-tight">
              {t.scanResultRetryScan}
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}
