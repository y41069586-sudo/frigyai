import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BADGE_UNLOCKED_EVENT, type BadgeUnlockedDetail } from "@/lib/badgeEvents";
import { useLanguage } from "@/contexts/LanguageContext";

export function BadgeUnlockCelebration() {
  const { language } = useLanguage();
  const [badge, setBadge] = useState<BadgeUnlockedDetail | null>(null);

  useEffect(() => {
    const onUnlocked = (event: Event) => {
      const customEvent = event as CustomEvent<BadgeUnlockedDetail>;
      if (!customEvent.detail) return;
      setBadge(customEvent.detail);
      window.setTimeout(() => setBadge(null), 2200);
    };

    window.addEventListener(BADGE_UNLOCKED_EVENT, onUnlocked as EventListener);
    return () => window.removeEventListener(BADGE_UNLOCKED_EVENT, onUnlocked as EventListener);
  }, []);

  const title =
    language === "fr" ? "Nouveau badge debloque !" : language === "en" ? "New badge unlocked!" : "Neues Badge freigeschaltet!";

  return (
    <AnimatePresence>
      {badge ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-[max(0.9rem,env(safe-area-inset-top))] z-[220] flex justify-center px-4"
        >
          <div className="flex min-w-[240px] max-w-sm items-center gap-3 rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 shadow-[0_20px_44px_-24px_rgba(16,185,129,0.45)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              {badge.badgeIcon || "🏅"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{title}</p>
              <p className="truncate text-sm font-semibold text-foreground">{badge.badgeName}</p>
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
