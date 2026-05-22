import { useMemo, useSyncExternalStore } from "react";
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
  const circularActive = Boolean(circular && options.length > 1);

  const selectedItem = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found ?? options[0];
  }, [options, value]);

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
        data={options}
        value={selectedItem}
        onChange={(item) => onChange(item.value)}
        itemHeight={rowHeight}
        visibleItems={WHEEL_VISIBLE_ITEMS}
        infinite={circularActive}
        momentum
        selectionOverlay={null}
        getItemKey={(item, index) =>
          circularActive ? `wheel-${index}-${item.value}` : item.value
        }
        renderItem={(opt, selected, index, activeIndex) => {
          const distance = Math.abs(index - activeIndex);
          const labelOpacity =
            distance === 0 ? 1 : distance === 1 ? 0.78 : distance === 2 ? 0.52 : 0.34;
          const scale = distance === 0 ? 1 : distance === 1 ? 0.98 : 0.9;

          return (
            <div
              className={`flex items-center w-full ${textAlignClass}`}
              style={{
                fontSize: `${selected ? selectedFontPx : idleFontPx}px`,
                fontWeight: selected ? 600 : 400,
                lineHeight: 1,
                color: selected ? "#1F2937" : "#9CA3AF",
                opacity: labelOpacity,
                transform: `translateZ(0) scale(${scale})`,
                letterSpacing: "-0.01em",
                transition: selected ? "none" : "opacity 0.12s ease-out",
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
