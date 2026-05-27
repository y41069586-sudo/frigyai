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
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { FRIGY_OVERLAY_OPEN, notifyOpenLogMeal } from "@/lib/overlayEvents";
interface BottomNavigationProps {
  trackerSetup?: boolean;
  trackerLoading?: boolean;
}

type NavId = "home" | "meals" | "shopping";

function navItems(t: ReturnType<typeof useLanguage>["t"], language: string) {
  const homeLabel =
    language === "de" ? "Start" : language === "fr" ? "Accueil" : "Home";
  return [
    { id: "home" as const, label: homeLabel, icon: Home, activeClass: "text-primary" },
    { id: "meals" as const, label: t.navMealPlan, icon: Calendar, activeClass: "text-primary" },
    { id: "shopping" as const, label: t.navShopping, icon: ShoppingCart, activeClass: "text-primary" },
  ];
}

export const BottomNavigation = (_props: BottomNavigationProps) => {
  const { t, language } = useLanguage();
  const ITEMS = navItems(t, language);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onOverlay = (e: Event) => {
      const open = Boolean((e as CustomEvent<{ open?: boolean }>).detail?.open);
      setOverlayOpen(open);
    };
    window.addEventListener(FRIGY_OVERLAY_OPEN, onOverlay);
    return () => window.removeEventListener(FRIGY_OVERLAY_OPEN, onOverlay);
  }, []);

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
    navigate(`/meal-plans?tab=${id}`, { replace: isMealPlans });
  };

  const openTracker = () => {
    if (isHome) {
      notifyOpenLogMeal(null);
      return;
    }
    navigate("/?logMeal=1");
  };

  const bar = (
    <nav
      aria-label="Hauptnavigation"
      className="pointer-events-none fixed inset-x-0 bottom-2 z-[90] flex justify-center px-4 safe-bottom"
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-end gap-1 overflow-visible rounded-full border border-white/70 bg-white/98 px-2 py-1 pr-1",
          "shadow-[0_14px_34px_-24px_rgba(0,0,0,0.3)] max-sm:backdrop-blur-none sm:bg-white/86 sm:backdrop-blur-2xl sm:shadow-[0_18px_46px_-22px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-background/95 sm:dark:bg-background/80",
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
              className="relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full px-0.5 py-1 transition-transform active:scale-[0.96]"
            >
              {active && (
                <motion.div
                  layoutId={isMobile ? undefined : "bottom-nav-active-pill"}
                  className="absolute inset-0 rounded-full bg-primary/[0.10] dark:bg-primary/20"
                  transition={
                    isMobile
                      ? { duration: 0.16, ease: [0.22, 1, 0.36, 1] }
                      : { type: "spring", stiffness: 380, damping: 32, mass: 0.85 }
                  }
                />
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
            "relative -mt-4 ml-1 flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[0_20px_42px_-16px_hsl(var(--primary)/0.85)] ring-4 ring-white",
            trackerActive
              ? "bg-primary ring-primary/35 ring-offset-2 ring-offset-background"
              : "bg-primary",
          )}
          aria-label={t.navTracker}
        >
          <Plus className="h-7 w-7 stroke-[3]" />
        </motion.button>
      </div>
    </nav>
  );

  if (!mounted || overlayOpen) return null;
  return createPortal(bar, document.body);
};
