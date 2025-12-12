import { Calendar, ShoppingCart, Target, Droplets, TrendingDown, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavigationProps {
  activeTab?: string;
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const { t } = useLanguage();
  const { subscriptionStatus } = useAuth();
  
  const isPremium = subscriptionStatus?.subscribed;
  
  const navItems = [
    { id: "meals", label: t.navMealPlan, icon: Calendar, href: "/meal-plans?tab=meals", color: "text-orange-400", requiresPremium: true },
    { id: "shopping", label: t.navShopping, icon: ShoppingCart, href: "/meal-plans?tab=shopping", color: "text-green-400", requiresPremium: true },
    { id: "tracker", label: t.navTracker, icon: Target, href: "/meal-plans?tab=tracker", color: "text-primary", requiresPremium: false },
    { id: "water", label: t.navWater, icon: Droplets, href: "/meal-plans?tab=water", color: "text-cyan-400", requiresPremium: true },
    { id: "progress", label: t.navStats, icon: TrendingDown, href: "/meal-plans?tab=progress", color: "text-purple-400", requiresPremium: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-between px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isLocked = item.requiresPremium && !isPremium;
          
          return (
            <NavLink key={item.id} to={isLocked ? "/premium" : item.href} className="flex-1">
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
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};