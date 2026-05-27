import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { memo, useMemo } from "react";
import { useHealthConnect } from "@/hooks/useHealthConnect";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { language } = useLanguage();
  const { isNativeApp, platform, isLoading, requestPermissions, syncHealthData } = useHealthConnect();
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
  const copy = language === "fr"
    ? {
        title: "Pas",
        hint: "Et si tu faisais\nune petite\nmarche ?",
        syncing: "Synchronisation...",
        sync: "Synchroniser les pas",
        mobileOnly: "Health Sync seulement sur mobile",
        openInApp: "Ouvrir dans l app",
        goal: "Objectif",
        today: "Aujourd'hui",
      }
    : language === "en"
      ? {
          title: "Steps",
          hint: "How about\na short\nwalk?",
          syncing: "Syncing...",
          sync: "Sync steps",
          mobileOnly: "Health Sync only on mobile",
          openInApp: "Open in app",
          goal: "Goal",
          today: "Today",
        }
      : {
          title: "Schritte",
          hint: "Wie waer's mit\neinem kurzen\nSpaziergang?",
          syncing: "Synchronisiere...",
          sync: "Schritte syncen",
          mobileOnly: "Health Sync nur auf dem Handy",
          openInApp: "In App oeffnen",
          goal: "Ziel",
          today: "Heute",
        };

  const hasSteps = steps > 0;
  const progressPct = Math.min(100, Math.round((steps / goal) * 100));

  const addSteps = async () => {
    if (isLoading) return;

    if (isNativeApp) {
      const granted = await requestPermissions();
      if (granted) {
        await syncHealthData();
      }
      return;
    }

    toast({
      title: healthSyncProvider ? `${providerName} ${copy.openInApp}` : copy.mobileOnly,
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
      className="relative min-h-[185px] min-w-0 w-full overflow-hidden rounded-[1.85rem] border border-primary/20 bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FFFA_58%,#EFFAF3_100%)]"
    >
      <div className="relative z-[10] grid min-h-[185px] grid-rows-[auto_1fr_auto] justify-items-center p-4">
        <div className="justify-self-start flex items-center gap-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[15px] leading-none">👟</span>
          <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.03em] text-foreground">{copy.title}</h3>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-2 px-1 py-1 text-center">
          {hasSteps ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {copy.today}
              </p>
              <p className="text-[32px] font-bold tabular-nums leading-none tracking-tight text-foreground">
                {steps.toLocaleString(language === "de" ? "de-DE" : language === "fr" ? "fr-FR" : "en-US")}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">
                {copy.goal}: {goal.toLocaleString(language === "de" ? "de-DE" : language === "fr" ? "fr-FR" : "en-US")}
              </p>
              <div className="h-1.5 w-full max-w-[150px] overflow-hidden rounded-full bg-primary/15">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-[12px] font-semibold leading-snug tracking-[-0.02em] text-foreground">
              {copy.hint.split("\n").map((line, index) => (
                <span key={index}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          )}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={isLoading}
          onClick={(e) => { e.stopPropagation(); void addSteps(); }}
          className="flex h-10 w-full min-w-0 items-center justify-center rounded-2xl border border-[#BDFDDD] bg-white px-2 text-[10px] font-semibold leading-none whitespace-nowrap text-foreground transition-colors active:bg-emerald-50"
        >
          <span className="whitespace-nowrap">{isLoading ? copy.syncing : copy.sync}</span>
        </motion.button>
      </div>
    </motion.div>
  );
});
