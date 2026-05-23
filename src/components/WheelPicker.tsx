import { useMemo } from "react";
import { NativeLikeWheelPicker } from "@/components/NativeLikeWheelPicker";

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

type WheelOption = { value: number; label: string };

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

function buildOptions(min: number, max: number, step: number, unit: string): WheelOption[] {
  if (step <= 0 || max < min) {
    const label = unit ? `${min} ${unit}` : String(min);
    return [{ value: min, label }];
  }
  const items: WheelOption[] = [];
  for (let v = min; v <= max; v += step) {
    items.push({ value: v, label: unit ? `${v} ${unit}` : String(v) });
  }
  return items.length > 0 ? items : [{ value: min, label: String(min) }];
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
  const options = useMemo(() => buildOptions(min, max, step, unit), [min, max, step, unit]);
  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value],
  );
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

      <NativeLikeWheelPicker
        data={options}
        value={selected}
        onChange={(item) => onChange(item.value)}
        itemHeight={ITEM_HEIGHT}
        visibleItems={VISIBLE_ITEMS}
        infinite={false}
        getItemKey={(item) => item.value}
        selectionOverlay={null}
        renderItem={(opt, isSelected, _index, activeIndex) => {
          const itemIndex = options.findIndex((o) => o.value === opt.value);
          const distance = Math.abs(itemIndex - activeIndex);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.78 : distance === 2 ? 0.52 : 0.34;

          return (
            <div
              className={`flex items-center justify-center select-none ${
                isSelected ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
              style={{
                fontSize: isSelected ? 18 : 15,
                fontWeight: isSelected ? 600 : 400,
                opacity,
                letterSpacing: "-0.01em",
                transition: isSelected ? "none" : "opacity 0.12s ease-out",
              }}
            >
              {opt.label}
            </div>
          );
        }}
      />
    </div>
  );
};
