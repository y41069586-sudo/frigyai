import { useCallback, useEffect, useMemo, useRef } from "react";

export const WHEEL_ITEM_HEIGHT = 44;
export const WHEEL_VISIBLE_ITEMS = 5;
export const WHEEL_PAD_ITEMS = Math.floor(WHEEL_VISIBLE_ITEMS / 2);

export type MintWheelOption = { value: number; label: string };

type MintWheelColumnProps = {
  options: MintWheelOption[];
  value: number;
  onChange: (value: number) => void;
  align?: "left" | "center" | "right";
  width?: number | string;
  ariaLabel?: string;
};

const haptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(4);
  }
};

export function MintWheelColumn({
  options,
  value,
  onChange,
  align = "center",
  width = "100%",
  ariaLabel,
}: MintWheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);
  const isProgrammaticRef = useRef(false);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const scrollToIndex = useCallback((idx: number, smooth: boolean) => {
    if (!scrollRef.current) return;
    isProgrammaticRef.current = true;
    scrollRef.current.scrollTo({
      top: idx * WHEEL_ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "auto",
    });
    setTimeout(
      () => {
        isProgrammaticRef.current = false;
      },
      smooth ? 260 : 30,
    );
  }, []);

  useEffect(() => {
    scrollToIndex(selectedIndex, false);
    lastIndexRef.current = selectedIndex;
  }, []);

  useEffect(() => {
    if (selectedIndex !== lastIndexRef.current) {
      scrollToIndex(selectedIndex, false);
      lastIndexRef.current = selectedIndex;
    }
  }, [selectedIndex, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticRef.current) return;
    const top = scrollRef.current.scrollTop;
    const idx = Math.round(top / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(options.length - 1, idx));

    if (clamped !== lastIndexRef.current) {
      haptic();
      lastIndexRef.current = clamped;
      onChange(options[clamped].value);
    }

    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const currentTop = scrollRef.current.scrollTop;
      const targetTop = lastIndexRef.current * WHEEL_ITEM_HEIGHT;
      if (Math.abs(currentTop - targetTop) > 0.5) {
        scrollToIndex(lastIndexRef.current, true);
      }
    }, 90);
  }, [options, onChange, scrollToIndex]);

  useEffect(
    () => () => {
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    },
    [],
  );

  const containerHeight = WHEEL_VISIBLE_ITEMS * WHEEL_ITEM_HEIGHT;
  const textAlignClass =
    align === "left"
      ? "justify-start pl-1"
      : align === "right"
        ? "justify-end pr-1"
        : "justify-center";

  return (
    <div
      className="relative shrink-0"
      style={{ height: containerHeight, width }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
          willChange: "scroll-position",
          transform: "translateZ(0)",
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: WHEEL_PAD_ITEMS * WHEEL_ITEM_HEIGHT }} />
        {options.map((opt, idx) => {
          const distance = Math.abs(idx - selectedIndex);
          const isSelected = idx === selectedIndex;
          const opacity =
            distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.28 : 0.15;
          return (
            <div
              key={opt.value}
              role="option"
              aria-selected={isSelected}
              className={`flex items-center ${textAlignClass}`}
              style={{
                height: WHEEL_ITEM_HEIGHT,
                scrollSnapAlign: "center",
                fontSize: isSelected ? "20px" : "15px",
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? "#1F2937" : "#6B7280",
                opacity,
                letterSpacing: "-0.01em",
                transition:
                  "font-size 160ms cubic-bezier(0.4,0,0.2,1), color 160ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.label}
            </div>
          );
        })}
        <div style={{ height: WHEEL_PAD_ITEMS * WHEEL_ITEM_HEIGHT }} />
      </div>
    </div>
  );
}
