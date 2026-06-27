import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Home,
  Calendar,
  ShoppingCart,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import LiquidGlass from "@/components/LiquidGlass";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { dismissStalledAuthNavigation } from "@/lib/authCompletion";
import { shouldHideBottomNavForFirstPlan } from "@/lib/firstWeekPlanFlow";
import { notifyOpenLogMeal, notifyOverlayOpen } from "@/lib/overlayEvents";
interface BottomNavigationProps {
  trackerSetup?: boolean;
  trackerLoading?: boolean;
}

type NavId = "home" | "meals" | "shopping";

const ITEMS: {
  id: NavId;
  labelKey: "navHome" | "navPlanShort" | "navShoppingShort";
  icon: LucideIcon;
  activeClass: string;
}[] = [
  { id: "home", labelKey: "navHome", icon: Home, activeClass: "text-primary" },
  { id: "meals", labelKey: "navPlanShort", icon: Calendar, activeClass: "text-primary" },
  { id: "shopping", labelKey: "navShoppingShort", icon: ShoppingCart, activeClass: "text-primary" },
];

export const BottomNavigation = (_props: BottomNavigationProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    notifyOverlayOpen(false);
  }, []);

  // Overlay state can get stuck after scan/camera — reset when route changes
  useEffect(() => {
    notifyOverlayOpen(false);
  }, [location.pathname, location.search]);

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
    dismissStalledAuthNavigation();
    if (id === "home") {
      navigate("/");
      return;
    }
    navigate(`/meal-plans?tab=${id}`, { replace: isMealPlans });
  };

  const openTracker = () => {
    dismissStalledAuthNavigation();
    if (isHome) {
      notifyOpenLogMeal(null);
      return;
    }
    navigate("/?logMeal=1");
  };

  const bar = (
    <nav
      aria-label={t.ariaMainNavigation}
      className="pointer-events-none fixed inset-x-0 bottom-2 z-[100] flex justify-center px-4 safe-bottom"
    >
      <LiquidGlass
        variant="clear"
        safeAreaEdge="bottom"
        borderRadius={999}
        className={cn(
          "liquid-tabbar pointer-events-auto flex w-full max-w-md items-end gap-1.5 overflow-visible px-2.5 py-1.5 pr-1.5",
        )}
      >
        {ITEMS.map((item) => {
          const active = isTabActive(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className="relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full px-1 py-1.5 transition-transform active:scale-[0.96]"
            >
              {active && (
                <motion.div
                  layoutId={isMobile ? undefined : "bottom-nav-active-pill"}
                  className="liquid-tab-active absolute inset-0 rounded-full"
                  transition={
                    isMobile
                      ? { duration: 0.16, ease: [0.22, 1, 0.36, 1] }
                      : { type: "spring", stiffness: 380, damping: 32, mass: 0.85 }
                  }
                />
              )}
              <Icon
                className={cn(
                  "relative z-[1] h-6 w-6",
                  active ? item.activeClass : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "relative z-[1] max-w-full truncate px-0.5 text-[9px] font-bold leading-tight sm:text-[10px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t[item.labelKey]}
              </span>
            </button>
          );
        })}

        <motion.button
          type="button"
          onClick={openTracker}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "lg-control lg-control--primary lg-control--circle relative -mt-5 ml-1 flex h-[62px] w-[62px] shrink-0 items-center justify-center text-primary-foreground ring-4 ring-white",
            trackerActive && "ring-primary/35 ring-offset-2 ring-offset-background",
          )}
          aria-label={t.navTracker}
        >
          <Plus className="h-8 w-8 stroke-[3] drop-shadow-[0_1px_1px_rgba(46,181,109,0.45)]" />
        </motion.button>
      </LiquidGlass>
    </nav>
  );

  if (!mounted || shouldHideBottomNavForFirstPlan()) return null;
  return createPortal(bar, document.body);
};
