import { useCallback, useMemo, useSyncExternalStore } from "react";
import { WebWheelPicker } from "@/components/WebWheelPicker";

export const WHEEL_VISIBLE_ITEMS = 5;
export const WHEEL_PAD_ITEMS = Math.floor(WHEEL_VISIBLE_ITEMS / 2);

const COMPACT_HEIGHT_MQ = "(max-height: 700px)";
export const WHEEL_ROW_COMPACT = 40;
export const WHEEL_ROW_COMFORT = 46;
export const WHEEL_ITEM_HEIGHT = WHEEL_ROW_COMFORT;

export function useMintWheelRowHeight(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(COMPACT_HEIGHT_MQ);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined" && window.matchMedia(COMPACT_HEIGHT_MQ).matches
        ? WHEEL_ROW_COMPACT
        : WHEEL_ROW_COMFORT,
    () => WHEEL_ROW_COMFORT,
  );
}

export type MintWheelOption = { value: number; label: string };

type MintWheelColumnProps = {
  options: MintWheelOption[];
  value: number;
  onChange: (value: number) => void;
  align?: "left" | "center" | "right";
  width?: number | string;
  ariaLabel?: string;
  rowHeight?: number;
  circular?: boolean;
  compactLabels?: boolean;
};

export function MintWheelColumn({
  options,
  value,
  onChange,
  align = "center",
  width = "100%",
  ariaLabel,
  rowHeight = WHEEL_ROW_COMFORT,
  circular = false,
  compactLabels = false,
}: MintWheelColumnProps) {
  const segmentLen = options.length;
  const circularActive = Boolean(circular && segmentLen > 1);

  const displayOptions = useMemo(() => {
    if (circularActive) {
      return [...options, ...options, ...options];
    }
    return options;
  }, [options, circularActive]);

  const selectedPhysical = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    const base = idx >= 0 ? idx : 0;
    return circularActive ? segmentLen + base : base;
  }, [circularActive, options, segmentLen, value]);

  const selectedItem = displayOptions[selectedPhysical] ?? displayOptions[0];

  const normalizeIndex = useCallback(
    (physical: number) => {
      if (!circularActive) return physical;
      if (physical < segmentLen) return physical + segmentLen;
      if (physical >= 2 * segmentLen) return physical - segmentLen;
      return physical;
    },
    [circularActive, segmentLen],
  );

  const textAlignClass =
    align === "left"
      ? "justify-start pl-1"
      : align === "right"
        ? "justify-end pr-1"
        : "justify-center";

  const idleFontPx = compactLabels
    ? rowHeight <= WHEEL_ROW_COMPACT
      ? 14
      : 15
    : rowHeight <= WHEEL_ROW_COMPACT
      ? 14
      : 17;
  const selectedFontPx = compactLabels
    ? rowHeight <= WHEEL_ROW_COMPACT
      ? 17
      : 18
    : rowHeight <= WHEEL_ROW_COMPACT
      ? 18
      : 22;

  return (
    <div
      className="relative shrink-0"
      style={{ width }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <WebWheelPicker
        data={displayOptions}
        value={selectedItem}
        onChange={(item) => onChange(item.value)}
        itemHeight={rowHeight}
        visibleItems={WHEEL_VISIBLE_ITEMS}
        normalizeIndex={normalizeIndex}
        getItemKey={(item, index) =>
          circularActive ? `wheel-${index}-${item.value}` : item.value
        }
        renderItem={(opt, selected) => {
          const opacity = selected ? 1 : 0.52;
          const scale = selected ? 1.12 : 0.9;

          return (
            <div
              className={`flex items-center w-full ${textAlignClass}`}
              style={{
                fontSize: `${selected ? selectedFontPx : idleFontPx}px`,
                fontWeight: selected ? 600 : 400,
                lineHeight: 1,
                color: selected ? "#1F2937" : "#4B5563",
                opacity,
                transform: `translateZ(0) scale(${selected ? 1 : scale})`,
                letterSpacing: "-0.01em",
                transition: "transform 120ms ease-out, color 120ms, opacity 120ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.label}
            </div>
          );
        }}
      />
    </div>
  );
}
