import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { ShoppingBag, ChevronRight, Check } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { ShoppingPreviewItem } from "@/lib/food-ai/dashboardMock";
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
  const openCount = top6.filter((it) => !checkedNames.has(normalizeShoppingName(it.name))).length;

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
      variant="soft"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10">
            <ShoppingBag className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Liste</p>
            <h3 className="truncate text-[15px] font-bold tracking-tight">
              {top6.length === 0
                ? "Leer"
                : allDone
                  ? "Alles da"
                  : `${openCount} offen`}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenList();
          }}
          className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-secondary px-3 text-[11px] font-bold text-secondary-foreground active:scale-95"
        >
          Öffnen
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {top6.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border/50 bg-background/45 px-3 py-4 text-center text-xs font-medium text-muted-foreground">
            Noch keine Zutaten
          </p>
        )}
        {top6.length > 0 && (
          <ul className="space-y-1.5">
            {top6.map((it) => {
              const normalizedName = normalizeShoppingName(it.name);
              const isChecked = checkedNames.has(normalizedName);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={(e) => toggle(it.name, e)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-xs backdrop-blur-sm transition-colors touch-manipulation",
                      isChecked
                        ? "border-transparent bg-muted/35 text-muted-foreground line-through"
                        : "border-border/40 bg-background/65 font-semibold text-foreground hover:border-primary/25",
                    )}
                  >
                      <span className="min-w-0">
                        <span className="block truncate">{it.name}</span>
                        {it.amount && (
                          <span className="mt-0.5 block text-[10px] font-normal normal-case text-muted-foreground">
                            {it.amount}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/25 bg-background/80",
                        )}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {expanded && (
        <p className="mt-3 text-xs text-muted-foreground">
          Tippe Zutaten ab. Mehr im Tab Einkauf.
        </p>
      )}
    </WidgetCard>
  );
}
