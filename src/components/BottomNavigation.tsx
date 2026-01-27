import { Calendar, ShoppingCart, Target, Droplets, BarChart3, Lock, NotebookPen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { motion } from "framer-motion";

interface BottomNavigationProps {
  activeTab?: string;
  trackerSetup?: boolean;
  trackerLoading?: boolean;
  onTabChange?: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, trackerSetup = false, trackerLoading = false, onTabChange }: BottomNavigationProps) => {
  const { t } = useLanguage();
  const { subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPremium = subscriptionStatus?.subscribed;
  const isOnMealPlansPage = location.pathname === '/meal-plans';
  
  // Items split: left side, center (elevated), right side
  // ALL features except water tracker require premium for free users
  const leftItems = [
    { id: "meals", label: t.navMealPlan, icon: Calendar, color: "text-orange-400", requiresPremium: true, requiresTracker: true },
    { id: "shopping", label: t.navShopping, icon: ShoppingCart, color: "text-primary", requiresPremium: true, requiresTracker: true },
  ];
  
  // Tracker (Tagebuch) now requires premium
  const centerItem = { id: "tracker", label: t.navTracker, icon: NotebookPen, color: "text-primary-foreground", requiresPremium: true, requiresTracker: false };
  
  const rightItems = [
    { id: "water", label: t.navWater, icon: Droplets, color: "text-cyan-400", requiresPremium: false, requiresTracker: false },
    { id: "progress", label: t.navStats, icon: BarChart3, color: "text-purple-400", requiresPremium: true, requiresTracker: true },
  ];

  const handleNavClick = (item: typeof leftItems[0]) => {
    const isLockedPremium = item.requiresPremium && !isPremium;
    const isLockedTracker = item.requiresTracker && !trackerSetup && isPremium;
    
    // Free users -> redirect to paywall for premium features
    if (isLockedPremium) {
      navigate('/premium-pricing');
      return;
    }
    
    if (isLockedTracker) {
      toast({
        title: t.setupTracker || "Tracker einrichten",
        description: t.setupTrackerFirst || "Bitte richte zuerst deinen Tracker ein",
      });
      if (onTabChange) {
        onTabChange('tracker');
      }
      navigate('/meal-plans?tab=tracker', { replace: isOnMealPlansPage });
      return;
    }
    
    if (onTabChange) {
      onTabChange(item.id);
    }
    navigate(`/meal-plans?tab=${item.id}`, { replace: isOnMealPlansPage });
  };

  const renderNavItem = (item: typeof leftItems[0], isCenter = false) => {
    const isActive = activeTab === item.id;
    const isLockedPremium = item.requiresPremium && !isPremium;
    const isLockedTracker = !trackerLoading && item.requiresTracker && !trackerSetup && isPremium;
    const isLocked = isLockedPremium || isLockedTracker;
    
    if (isCenter) {
      return (
        <motion.button
          key={item.id}
          onPointerDown={() => handleNavClick(item)}
          type="button"
          className="relative -mt-2 z-10 touch-none select-none"
          whileTap={{ scale: 0.97 }}
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all",
            "bg-primary",
            isActive && "shadow-[0_0_15px_hsla(var(--primary),0.4)]"
          )}>
            <item.icon className="h-5 w-5 text-primary-foreground" />
          </div>
          {isActive && (
            <motion.div 
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
              layoutId="activeIndicator"
            />
          )}
        </motion.button>
      );
    }
    
    return (
      <button
        key={item.id}
        onPointerDown={() => handleNavClick(item)}
        type="button"
        className="flex-1 min-h-[56px] select-none touch-none active:scale-95 transition-transform"
      >
        <div className={cn(
          "flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl transition-colors relative h-full",
          isActive && "text-foreground",
          isLocked && "opacity-50"
        )}>
          {isLocked && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted rounded-full flex items-center justify-center">
              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          )}
          <item.icon className={cn(
            "h-5 w-5 transition-colors",
            isActive ? item.color : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-[10px] font-medium transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {item.label}
          </span>
          {isActive && (
            <motion.div 
              className="absolute -bottom-1 w-1 h-1 rounded-full bg-current"
              style={{ color: item.color.replace('text-', '') }}
              layoutId={`dot-${item.id}`}
            />
          )}
        </div>
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-4 bottom-0 z-50 safe-bottom">
      <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-md px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Left items */}
          {leftItems.map((item) => renderNavItem(item))}
          
          {/* Center elevated item */}
          {renderNavItem(centerItem, true)}
          
          {/* Right items */}
          {rightItems.map((item) => renderNavItem(item))}
        </div>
      </div>
    </nav>
  );
};
