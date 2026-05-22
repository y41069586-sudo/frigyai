import { useMemo } from "react";
import { WebWheelPicker } from "@/components/WebWheelPicker";

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;

function buildItems(min: number, max: number, step: number): number[] {
  if (step <= 0 || max < min) return [min];
  const items: number[] = [];
  for (let v = min; v <= max; v += step) {
    items.push(v);
  }
  return items.length > 0 ? items : [min];
}

/** Numeric wheel — UI chrome + shared WebWheelPicker (RN FlatList port). */
export const WheelPicker = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: WheelPickerProps) => {
  const data = useMemo(() => buildItems(min, max, step), [min, max, step]);
  const padHeight = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

  return (
    <div className="relative mx-auto w-full">
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: padHeight,
          background:
            "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 50%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: padHeight,
          background:
            "linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 50%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-2 z-0 pointer-events-none border-2 border-primary/50 bg-primary/10 rounded-xl"
        style={{
          top: padHeight,
          height: ITEM_HEIGHT,
        }}
      />

      <WebWheelPicker
        data={data}
        value={value}
        onChange={(item) => onChange(item)}
        itemHeight={ITEM_HEIGHT}
        visibleItems={VISIBLE_ITEMS}
        infinite={false}
        getItemKey={(item) => item}
        selectionOverlay={null}
        renderItem={(item, selected, _index, activeIndex) => {
          const itemIndex = data.indexOf(item);
          const distance = Math.abs(itemIndex - activeIndex);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;

          return (
            <div
              className={`flex items-center justify-center select-none gap-1 ${
                selected ? "text-primary font-bold" : "text-muted-foreground"
              }`}
              style={{
                fontSize: selected ? "1.5rem" : "1rem",
                opacity,
                transform: selected ? "scale(1.05)" : "scale(0.9)",
                transition: selected ? "none" : "opacity 0.12s ease-out, transform 0.12s ease-out",
              }}
            >
              <span>{item}</span>
              <span
                className={
                  selected ? "text-sm text-primary/70" : "text-xs text-muted-foreground/60"
                }
              >
                {unit}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
};
