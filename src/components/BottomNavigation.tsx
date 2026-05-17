import {
  Home,
  Calendar,
  ShoppingCart,
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
import { useIsMobile } from "@/hooks/use-mobile";
interface BottomNavigationProps {
  trackerSetup?: boolean;
  trackerLoading?: boolean;
}

type NavId = "home" | "meals" | "shopping";

const ITEMS: {
  id: NavId;
  label: string;
  icon: LucideIcon;
  activeClass: string;
  feature: Feature | null;
}[] = [
  { id: "home", label: "Start", icon: Home, activeClass: "text-primary", feature: null },
  { id: "meals", label: "Plan", icon: Calendar, activeClass: "text-primary", feature: "meal_plans" },
  { id: "shopping", label: "Einkauf", icon: ShoppingCart, activeClass: "text-primary", feature: "shopping_list" },
];

export const BottomNavigation = (_props: BottomNavigationProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canAccessFeature } = useFeatureAccess();
  const isMobile = useIsMobile();

  const pathname = location.pathname;
  const tab = searchParams.get("tab") || "meals";
  const isMealPlans = pathname === "/meal-plans";
  const isHome = pathname === "/";

  const isTabActive = (id: NavId): boolean => {
    if (id === "home") return isHome;
    if (!isMealPlans) return false;
    return tab === id;
  };

  const trackerActive = isHome && searchParams.get("logMeal") === "1";

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
        navigate("/?setupTracker=1", { replace: isHome });
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
      navigate("/?setupTracker=1", { replace: isHome });
      return;
    }
    navigate("/?logMeal=1", { replace: isHome });
  };

  const trackerLocked = !canAccessFeature("tracker_full").canAccess;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-5 safe-bottom">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-center gap-1 overflow-visible rounded-full border border-white/70 bg-white/95 px-2 py-1.5 pr-1",
          "shadow-[0_14px_34px_-24px_rgba(0,0,0,0.3)] sm:bg-white/86 sm:backdrop-blur-2xl sm:shadow-[0_18px_46px_-22px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-background/92 sm:dark:bg-background/80",
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
              className="relative flex min-h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full px-0.5 py-1 transition-transform active:scale-[0.96]"
            >
              {active && isMobile && (
                <div className="absolute inset-0 rounded-full bg-primary/[0.10] dark:bg-primary/20" />
              )}
              {active && !isMobile && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 rounded-full bg-primary/[0.10] dark:bg-primary/20"
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
                  "relative z-[1] max-w-full truncate px-0.5 text-[8px] font-bold leading-tight",
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
          whileTap={{ scale: 0.94 }}
          className={cn(
            "relative -mt-5 ml-1 flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[0_20px_42px_-16px_hsl(var(--primary)/0.85)] ring-4 ring-white",
            trackerActive
              ? "bg-primary ring-primary/35 ring-offset-2 ring-offset-background"
              : "bg-primary",
          )}
          aria-label={t.navTracker}
        >
          {trackerLocked && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-2 ring-background">
              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
          )}
          <Plus className="h-8 w-8 stroke-[3]" />
        </motion.button>
      </div>
    </nav>
  );
};
