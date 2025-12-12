import { Calendar, ShoppingCart, Target, Droplets, TrendingDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab?: string;
}

const navItems = [
  { id: "meals", label: "Wochenplan", icon: Calendar, href: "/meal-plans?tab=meals", color: "text-orange-400" },
  { id: "shopping", label: "Einkaufsliste", icon: ShoppingCart, href: "/meal-plans?tab=shopping", color: "text-green-400" },
  { id: "tracker", label: "Tracker", icon: Target, href: "/meal-plans?tab=tracker", color: "text-primary" },
  { id: "water", label: "Wasser", icon: Droplets, href: "/meal-plans?tab=water", color: "text-cyan-400" },
  { id: "progress", label: "Stats", icon: TrendingDown, href: "/meal-plans?tab=progress", color: "text-purple-400" },
];

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <NavLink key={item.id} to={item.href}>
              <div className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
                isActive ? "bg-primary/15" : "hover:bg-muted/50"
              )}>
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
