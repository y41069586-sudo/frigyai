import { useEffect, type RefObject } from "react";
import {
  Home,
  Calendar,
  ShoppingCart,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BlurView } from "@/components/ui/BlurView";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIOSPlatform } from "@/hooks/useIOSPlatform";
import { useTabBarMinimize } from "@/hooks/useTabBarMinimize";
import { motion, useReducedMotion } from "framer-motion";
import { dismissStalledAuthNavigation } from "@/lib/authCompletion";
import { shouldHideBottomNavForFirstPlan } from "@/lib/firstWeekPlanFlow";
import { notifyOpenLogMeal, notifyOverlayOpen } from "@/lib/overlayEvents";
import { triggerWheelHaptic } from "@/lib/wheelPickerUtils";

interface BottomNavigationProps {
  trackerSetup?: boolean;
  trackerLoading?: boolean;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

type NavId = "home" | "meals" | "shopping";

const ITEMS: {
  id: NavId;
  labelKey: "navHome" | "navPlanShort" | "navShoppingShort";
  icon: LucideIcon;
}[] = [
  { id: "home", labelKey: "navHome", icon: Home },
  { id: "meals", labelKey: "navPlanShort", icon: Calendar },
  { id: "shopping", labelKey: "navShoppingShort", icon: ShoppingCart },
];

/** iOS UISpringTimingParameters-like curve used across the system. */
const IOS_SPRING = { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.82 };
const IOS_TAP = { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const };

export const BottomNavigation = ({
  scrollContainerRef,
}: BottomNavigationProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const ios = useIOSPlatform();
  const reduceMotion = useReducedMotion();
  const minimized = useTabBarMinimize(scrollContainerRef ?? { current: null }, ios && !reduceMotion);

  useEffect(() => {
    notifyOverlayOpen(false);
  }, []);

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
    triggerWheelHaptic();
    dismissStalledAuthNavigation();
    if (id === "home") {
      navigate("/");
      return;
    }
    navigate(`/meal-plans?tab=${id}`, { replace: isMealPlans });
  };

  const openTracker = () => {
    triggerWheelHaptic();
    dismissStalledAuthNavigation();
    if (isHome) {
      notifyOpenLogMeal(null);
      return;
    }
    navigate("/?logMeal=1");
  };

  if (shouldHideBottomNavForFirstPlan()) return null;

  const layoutId = isMobile ? undefined : "ios-liquid-tab-indicator";
  const dockClass = scrollContainerRef
    ? "absolute inset-x-0 bottom-0"
    : "fixed inset-x-0 bottom-0";

  return (
    <div
      className={cn(
        "pointer-events-none z-[100] flex flex-col items-center px-5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]",
        dockClass,
      )}
      aria-hidden={false}
    >
      {/* tabViewBottomAccessory — primary action above tab bar (iOS 26 pattern) */}
      <motion.div
        className="pointer-events-auto mb-3 flex w-full max-w-[min(100%,24rem)] justify-end"
        animate={minimized ? { opacity: 0.88, y: 10, scale: 0.94 } : { opacity: 1, y: 0, scale: 1 }}
        transition={IOS_SPRING}
      >
        <motion.button
          type="button"
          onClick={openTracker}
          whileTap={{ scale: 0.92 }}
          transition={IOS_TAP}
          aria-label={t.navTracker}
          className="relative"
        >
          <BlurView
            variant="pill"
            intensity={48}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full shadow-[0_16px_40px_-14px_hsl(var(--primary)/0.75)]",
              trackerActive && "ring-2 ring-primary/40 ring-offset-2 ring-offset-transparent",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground",
                trackerActive && "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
              )}
            >
              <Plus className="h-7 w-7 stroke-[2.75]" />
            </span>
          </BlurView>
        </motion.button>
      </motion.div>

      {/* Floating Liquid Glass tab bar — UITabBar capsule */}
      <motion.nav
        aria-label={t.ariaMainNavigation}
        className="pointer-events-auto w-full max-w-[min(100%,24rem)]"
        animate={
          minimized
            ? { y: 6, scale: 0.96, opacity: 0.94 }
            : { y: 0, scale: 1, opacity: 1 }
        }
        transition={IOS_SPRING}
      >
        <BlurView
          variant="tabBar"
          intensity={72}
          className="flex h-[49px] items-stretch gap-0.5 rounded-[1.35rem] px-1.5 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.28)]"
        >
          {ITEMS.map((item) => {
            const active = isTabActive(item.id);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-1 py-1"
              >
                {active && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-[2px] rounded-[1rem] bg-primary/[0.12] dark:bg-primary/20"
                    transition={reduceMotion ? { duration: 0 } : IOS_SPRING}
                  />
                )}
                <motion.div
                  className="relative z-[1] flex flex-col items-center justify-center gap-0.5"
                  animate={{
                    scale: active ? 1.04 : 1,
                    y: active ? -0.5 : 0,
                  }}
                  transition={reduceMotion ? { duration: 0 } : IOS_SPRING}
                >
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-colors duration-200",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  <motion.span
                    className={cn(
                      "max-w-full truncate text-[10px] font-semibold leading-none tracking-tight",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                    animate={
                      minimized
                        ? { opacity: 0, height: 0, marginTop: 0 }
                        : { opacity: 1, height: "auto", marginTop: 0 }
                    }
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {t[item.labelKey]}
                  </motion.span>
                </motion.div>
              </button>
            );
          })}
        </BlurView>
      </motion.nav>
    </div>
  );
};
