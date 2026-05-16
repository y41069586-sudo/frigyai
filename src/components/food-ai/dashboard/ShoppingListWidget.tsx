import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { ShoppingBag, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "./WidgetCard";
import {
  groupShoppingByCategory,
  type ShoppingPreviewItem,
} from "@/lib/food-ai/dashboardMock";
import { FRIGY_STORAGE_UPDATED, notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import {
  normalizeShoppingName,
  readCheckedShoppingNames,
  writeCheckedShoppingNames,
} from "@/lib/shoppingSync";
import { cn } from "@/lib/utils";

type ShoppingListWidgetProps = {
  items: ShoppingPreviewItem[];
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onOpenList: () => void;
};

export function ShoppingListWidget({
  items,
  delay = 0,
  expanded,
  onToggleExpand,
  onOpenList,
}: ShoppingListWidgetProps) {
  const top6 = useMemo(() => items.slice(0, 4), [items]);
  const [checkedNames, setCheckedNames] = useState<Set<string>>(readCheckedShoppingNames);

  useEffect(() => {
    const valid = new Set(items.map((i) => normalizeShoppingName(i.name)));
    setCheckedNames((prev) => {
      const next = new Set([...prev].filter((name) => valid.has(name)));
      if (next.size === prev.size && [...prev].every((name) => next.has(name))) return prev;
      return next;
    });
  }, [items]);

  useEffect(() => {
    writeCheckedShoppingNames(checkedNames);
    notifyFrigyStorageUpdated();
  }, [checkedNames]);

  useEffect(() => {
    const syncChecked = () => setCheckedNames(readCheckedShoppingNames());
    const onStorage = (e: StorageEvent) => {
      if (e.key == null || e.key.startsWith("frigy_shopping_checked")) {
        syncChecked();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(FRIGY_STORAGE_UPDATED, syncChecked);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FRIGY_STORAGE_UPDATED, syncChecked);
    };
  }, []);

  const allDone = top6.length > 0 && top6.every((it) => checkedNames.has(normalizeShoppingName(it.name)));
  const grouped = groupShoppingByCategory(top6);

  const toggle = (name: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const normalized = normalizeShoppingName(name);
    setCheckedNames((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) next.delete(normalized);
      else next.add(normalized);
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
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
          <ShoppingBag className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Einkauf</p>
          <h3 className="text-sm min-[360px]:text-base font-semibold tracking-tight">
            {top6.length === 0
              ? "Keine Liste"
              : allDone
                ? "Alles da"
                : "Zutaten fehlen"}
          </h3>
          {top6.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {top6.length} aktuelle Eintraege aus deiner Einkaufsliste
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {top6.length === 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Deine Einkaufsliste ist gerade leer. Sobald ein Plan erstellt ist, siehst du hier die fehlenden Zutaten live.
          </p>
        )}
        {Array.from(grouped.entries()).map(([cat, list]) => (
          <div key={cat}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{cat}</p>
            <ul className="space-y-1.5">
              {list.map((it) => {
                const normalizedName = normalizeShoppingName(it.name);
                const isChecked = checkedNames.has(normalizedName);
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={(e) => toggle(it.name, e)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-2 text-left text-xs backdrop-blur-sm transition-colors touch-manipulation",
                        isChecked
                          ? "border-border/30 bg-muted/30 text-muted-foreground line-through"
                          : "border-border/50 bg-background/50 font-medium text-foreground hover:border-primary/25",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{it.name}</span>
                        {it.amount && (
                          <span className="block text-[11px] text-muted-foreground mt-0.5 normal-case font-normal">
                            {it.amount}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 min-[360px]:h-7 min-[360px]:w-7 shrink-0 items-center justify-center rounded-lg min-[360px]:rounded-xl border-2 transition-colors",
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
        className="mt-2.5 h-9 touch-target w-full rounded-xl font-semibold text-xs"
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
