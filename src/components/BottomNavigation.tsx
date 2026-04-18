import {
  Home,
  Calendar,
  ShoppingCart,
  Droplets,
  BarChart3,
  Plus,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFeatureAccess, type Feature } from "@/hooks/useFeatureAccess";
import { motion } from "framer-motion";

interface BottomNavigationProps {
  trackerSetup?: boolean;
  trackerLoading?: boolean;
}

type NavId = "home" | "meals" | "shopping" | "water" | "progress";

const ITEMS: {
  id: NavId;
  label: string;
  icon: LucideIcon;
  activeClass: string;
  feature: Feature | null;
}[] = [
  { id: "home", label: "Start", icon: Home, activeClass: "text-primary", feature: null },
  { id: "meals", label: "Wochenplan", icon: Calendar, activeClass: "text-orange-500", feature: "meal_plans" },
  { id: "shopping", label: "Einkauf", icon: ShoppingCart, activeClass: "text-primary", feature: "shopping_list" },
  { id: "water", label: "Wasser", icon: Droplets, activeClass: "text-cyan-500", feature: "water" },
  { id: "progress", label: "Statistik", icon: BarChart3, activeClass: "text-purple-500", feature: "progress" },
];

export const BottomNavigation = (_props: BottomNavigationProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canAccessFeature } = useFeatureAccess();

  const pathname = location.pathname;
  const tab = searchParams.get("tab") || "tracker";
  const isMealPlans = pathname === "/meal-plans";

  const isTabActive = (id: NavId): boolean => {
    if (id === "home") return pathname === "/";
    if (!isMealPlans) return false;
    return tab === id;
  };

  const trackerActive = isMealPlans && tab === "tracker";

  const go = (id: NavId) => {
    if (id === "home") {
      navigate("/");
      return;
    }
    const meta = ITEMS.find((x) => x.id === id);
    if (meta?.feature) {
      const access = canAccessFeature(meta.feature);
      if (!access.canAccess) {
        if (access.lockReason === "tracker_not_setup") {
          toast({
            title: t.setupTracker || "Tracker einrichten",
            description: access.message || t.setupTrackerFirst || "Bitte richte zuerst deinen Tracker ein",
          });
        }
        navigate("/meal-plans?tab=tracker", { replace: isMealPlans });
        return;
      }
    }
    navigate(`/meal-plans?tab=${id}`, { replace: isMealPlans });
  };

  const openTracker = () => {
    const access = canAccessFeature("tracker_full");
    if (!access.canAccess) {
      if (access.lockReason === "tracker_not_setup") {
        toast({
          title: t.setupTracker || "Tracker einrichten",
          description: access.message || t.setupTrackerFirst || "Bitte richte zuerst deinen Tracker ein",
        });
      }
      navigate("/meal-plans?tab=tracker", { replace: isMealPlans });
      return;
    }
    navigate("/meal-plans?tab=tracker", { replace: isMealPlans });
  };

  const trackerLocked = !canAccessFeature("tracker_full").canAccess;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-3 safe-bottom">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-lg items-end gap-0.5 rounded-[2rem] border border-white/30 bg-background/90 px-1.5 py-2",
          "shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-background/80",
        )}
      >
        {ITEMS.map((item) => {
          const active = isTabActive(item.id);
          const Icon = item.icon;
          const locked = item.feature ? !canAccessFeature(item.feature).canAccess : false;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className="relative flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl px-0.5 py-1 transition-transform active:scale-[0.97]"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 rounded-2xl bg-primary/[0.12] dark:bg-primary/20"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {locked && (
                <span className="absolute right-1 top-0 z-[2] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted/90">
                  <Lock className="h-2 w-2 text-muted-foreground" />
                </span>
              )}
              <Icon
                className={cn(
                  "relative z-[1] h-[22px] w-[22px]",
                  active ? item.activeClass : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "relative z-[1] max-w-full truncate px-0.5 text-[8px] font-bold leading-tight sm:text-[9px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        <motion.button
          type="button"
          onClick={openTracker}
          whileTap={{ scale: 0.96 }}
          className={cn(
            "relative -mt-6 ml-0.5 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-xl",
            trackerActive
              ? "bg-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
              : "bg-primary shadow-primary/30",
          )}
          aria-label={t.navTracker}
        >
          {trackerLocked && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-2 ring-background">
              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
          )}
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </motion.button>
      </div>
    </nav>
  );
};
