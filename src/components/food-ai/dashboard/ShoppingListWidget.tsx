import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { ShoppingBag, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "./WidgetCard";
import {
  groupShoppingByCategory,
  type ShoppingPreviewItem,
} from "@/lib/food-ai/dashboardMock";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "frigy_shopping_checked_ids";

type ShoppingListWidgetProps = {
  items: ShoppingPreviewItem[];
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onOpenList: () => void;
};

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function ShoppingListWidget({
  items,
  delay = 0,
  expanded,
  onToggleExpand,
  onOpenList,
}: ShoppingListWidgetProps) {
  const top5 = useMemo(() => items.slice(0, 5), [items]);
  const [checked, setChecked] = useState<Set<string>>(loadChecked);

  useEffect(() => {
    const valid = new Set(items.map((i) => i.id));
    setChecked((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) return prev;
      return next;
    });
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
  }, [checked]);

  const allDone = top5.length > 0 && top5.every((it) => checked.has(it.id));
  const grouped = groupShoppingByCategory(top5);

  const toggle = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <WidgetCard
      delay={delay}
      variant="glass"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl rounded-tl-md bg-violet-500/10">
          <ShoppingBag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Einkauf</p>
          <h3 className="text-lg font-semibold tracking-tight">
            {top5.length === 0
              ? "Keine Liste"
              : allDone
                ? "Alles da"
                : "Zutaten fehlen"}
          </h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {top5.length === 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nach einem <span className="font-medium text-foreground">Frigy Plan</span> erscheinen Zutaten hier. Nur
            Kühlschrank-Scan füllt die Liste nicht.
          </p>
        )}
        {Array.from(grouped.entries()).map(([cat, list]) => (
          <div key={cat}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{cat}</p>
            <ul className="space-y-1.5">
              {list.map((it) => {
                const isChecked = checked.has(it.id);
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={(e) => toggle(it.id, e)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm backdrop-blur-sm transition-colors",
                        isChecked
                          ? "border-border/30 bg-muted/30 text-muted-foreground line-through"
                          : "border-border/50 bg-background/50 font-medium text-foreground hover:border-primary/25",
                      )}
                    >
                      <span>{it.name}</span>
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 transition-colors",
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-background/80",
                        )}
                      >
                        {isChecked && <Check className="h-4 w-4" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-5 h-11 w-full rounded-2xl rounded-br-2xl rounded-tl-md font-semibold"
        onClick={(e) => {
          e.stopPropagation();
          onOpenList();
        }}
      >
        Liste öffnen
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>

      {expanded && (
        <p className="mt-3 text-xs text-muted-foreground">
          Tippe auf eine Zutat, um sie als erledigt zu markieren. Vollständige Liste im Tab Einkauf.
        </p>
      )}
    </WidgetCard>
  );
}
