import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { MockDayPlan } from "@/lib/food-ai/types";
import { groupShoppingByCategory } from "@/lib/food-ai/mock";
import type { ShoppingItem } from "@/lib/food-ai/types";
import { cn } from "@/lib/utils";

type WeekPlannerProps = {
  days: MockDayPlan[];
  shoppingList: ShoppingItem[];
  compact?: boolean;
};

export function WeekPlanner({ days, shoppingList, compact }: WeekPlannerProps) {
  const [openDay, setOpenDay] = useState<string | null>(days[0]?.day ?? null);
  const grouped = groupShoppingByCategory(shoppingList);

  return (
    <div className={cn("space-y-6 w-full", compact && "max-h-[60vh] overflow-y-auto pr-1")}>
      <div className="space-y-2">
        <h3 className="text-lg font-bold">7-Tage-Überblick</h3>
        {days.map((d, idx) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="rounded-2xl border border-primary/15 bg-card/80 backdrop-blur-md overflow-hidden shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-foreground hover:bg-primary/5"
              onClick={() => setOpenDay(openDay === d.day ? null : d.day)}
            >
              {d.day}
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", openDay === d.day && "rotate-180")}
              />
            </button>
            {openDay === d.day && (
              <div className="border-t border-border/50 px-4 py-3 space-y-2 bg-gradient-to-b from-transparent to-primary/5">
                {d.meals.map((m) => (
                  <div key={m.type + m.name} className="text-sm">
                    <span className="text-primary font-medium">{m.type}:</span>{" "}
                    <span className="text-foreground">{m.name}</span>
                    <span className="text-muted-foreground"> · {m.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3">Einkauf (Kategorien)</h3>
        <div className="space-y-4 rounded-2xl border border-primary/15 bg-card/60 p-4 backdrop-blur-sm">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/90 mb-2">{cat}</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {items.map((it) => (
                  <li key={it.name + it.amount} className="flex justify-between gap-2">
                    <span>{it.name}</span>
                    <span className="shrink-0 text-foreground/80">{it.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
