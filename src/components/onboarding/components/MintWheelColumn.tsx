import { useMemo, useSyncExternalStore } from "react";
import {
  NativeLikeWheelPicker,
  type WheelPickerSnapPreset,
  type WheelPickerTuning,
} from "@/components/NativeLikeWheelPicker";

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
  /** Numbers only in the wheel; unit shown for screen readers / optional suffix. */
  unitSuffix?: string;
  snapPreset?: WheelPickerSnapPreset;
  tuning?: Partial<WheelPickerTuning>;
  wheelKey?: string | number;
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
  unitSuffix,
  snapPreset = "default",
  tuning,
  wheelKey,
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
  const activeFontPx = compactLabels
    ? rowHeight <= WHEEL_ROW_COMPACT
      ? 17
      : 18
    : rowHeight <= WHEEL_ROW_COMPACT
      ? 18
      : 22;

  const formatLiveLabel = (opt: MintWheelOption) =>
    unitSuffix ? `${opt.label} ${unitSuffix}` : opt.label;

  return (
    <div className="relative shrink-0" style={{ width }}>
      <NativeLikeWheelPicker
        key={wheelKey}
        data={options}
        value={selectedItem}
        onChange={(item) => onChange(item.value)}
        itemHeight={rowHeight}
        visibleItems={WHEEL_VISIBLE_ITEMS}
        infinite={circularActive}
        snapPreset={snapPreset}
        tuning={tuning}
        enableHaptics
        tapToSelect
        ariaLabel={ariaLabel}
        formatLiveLabel={formatLiveLabel}
        getItemKey={(item, index) =>
          circularActive ? `wheel-${index}-${item.value}` : item.value
        }
        renderItem={(opt, selected, _logical, _active, isCenter) => {
          const highlighted = isCenter || selected;
          return (
            <div
              className={`flex w-full items-center ${textAlignClass}`}
              style={{
                fontSize: `${highlighted ? activeFontPx : idleFontPx}px`,
                fontWeight: highlighted ? 600 : 400,
                lineHeight: 1,
                color: highlighted ? "#1F2937" : "#9CA3AF",
                letterSpacing: "-0.01em",
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
