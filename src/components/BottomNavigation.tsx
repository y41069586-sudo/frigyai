import { Calendar, ShoppingCart, Target, Droplets, TrendingDown, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface BottomNavigationProps {
  activeTab?: string;
  trackerSetup?: boolean;
  onTabChange?: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, trackerSetup = false, onTabChange }: BottomNavigationProps) => {
  const { t } = useLanguage();
  const { subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPremium = subscriptionStatus?.subscribed;
  const isOnMealPlansPage = location.pathname === '/meal-plans';
  
  const navItems = [
    { id: "meals", label: t.navMealPlan, icon: Calendar, color: "text-orange-400", requiresPremium: true, requiresTracker: true },
    { id: "shopping", label: t.navShopping, icon: ShoppingCart, color: "text-green-400", requiresPremium: true, requiresTracker: true },
    { id: "tracker", label: t.navTracker, icon: Target, color: "text-primary", requiresPremium: false, requiresTracker: false },
    { id: "water", label: t.navWater, icon: Droplets, color: "text-cyan-400", requiresPremium: true, requiresTracker: true },
    { id: "progress", label: t.navStats, icon: TrendingDown, color: "text-purple-400", requiresPremium: true, requiresTracker: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    const isLockedPremium = item.requiresPremium && !isPremium;
    const isLockedTracker = item.requiresTracker && !trackerSetup && isPremium;
    
    if (isLockedPremium) {
      navigate('/premium');
      return;
    }
    
    if (isLockedTracker) {
      toast({
        title: t.setupTracker || "Tracker einrichten",
        description: t.setupTrackerFirst || "Bitte richte zuerst deinen Tracker ein",
      });
      // Navigate to meal-plans with tracker tab
      navigate('/meal-plans?tab=tracker');
      if (onTabChange) {
        onTabChange('tracker');
      }
      return;
    }
    
    // If not on meal-plans page, navigate there with the tab
    if (!isOnMealPlansPage) {
      navigate(`/meal-plans?tab=${item.id}`);
    } else {
      // On meal-plans page, just update tab via callback and URL
      navigate(`/meal-plans?tab=${item.id}`, { replace: true });
    }
    
    if (onTabChange) {
      onTabChange(item.id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-between px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isLockedPremium = item.requiresPremium && !isPremium;
          const isLockedTracker = item.requiresTracker && !trackerSetup && isPremium;
          const isLocked = isLockedPremium || isLockedTracker;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="flex-1"
            >
              <div className={cn(
                "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all relative",
                isActive ? "bg-primary/15" : "hover:bg-muted/50",
                isLocked && "opacity-60"
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
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};