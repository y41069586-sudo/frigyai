import { useMemo } from "react";
import { StableWheelPicker } from "@/components/StableWheelPicker";

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

function buildOptions(min: number, max: number, step: number): WheelOption[] {
  if (step <= 0 || max < min) {
    return [{ value: min, label: String(min) }];
  }
  const items: WheelOption[] = [];
  for (let v = min; v <= max; v += step) {
    items.push({ value: v, label: String(v) });
  }
  return items.length > 0 ? items : [{ value: min, label: String(min) }];
}

/** Numeric wheel with card chrome — numbers in wheel, unit for a11y / live region. */
export const WheelPicker = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: WheelPickerProps) => {
  const options = useMemo(() => buildOptions(min, max, step), [min, max, step]);
  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value],
  );
  const padHeight = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
  const unitTrimmed = unit.trim();

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

      <StableWheelPicker
        data={options}
        value={selected}
        onChange={(item) => onChange(item.value)}
        itemHeight={ITEM_HEIGHT}
        visibleItems={VISIBLE_ITEMS}
        infinite={false}
        getItemKey={(item) => item.value}
        selectionOverlay={null}
        ariaLabel={unitTrimmed ? `Wert in ${unitTrimmed}` : "Wert auswählen"}
        formatLiveLabel={(opt) => (unitTrimmed ? `${opt.label} ${unitTrimmed}` : opt.label)}
        renderItem={(opt, selected, _i, _a, isCenter) => {
          const highlighted = selected || isCenter;
          return (
            <div
              className={`flex select-none items-center justify-center ${
                highlighted ? "font-semibold text-primary" : "text-muted-foreground"
              }`}
              style={{
                fontSize: highlighted ? 18 : 15,
                fontWeight: highlighted ? 600 : 400,
                letterSpacing: "-0.01em",
              }}
            >
              {opt.label}
              {highlighted && unitTrimmed ? (
                <span className="ml-1 text-sm font-medium text-primary/70">{unitTrimmed}</span>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
};
