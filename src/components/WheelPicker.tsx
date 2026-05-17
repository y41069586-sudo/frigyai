import { useRef, useEffect, useCallback, useState } from 'react';

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([5, 10, 5]); // More noticeable haptic pattern
  }
};

export const WheelPicker = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = ''
}: WheelPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const [selectedValue, setSelectedValue] = useState(value);
  const isScrollingRef = useRef(false);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const lastHapticValueRef = useRef(value);

  const itemHeight = 48;
  const visibleItems = 3;
  const paddingItems = Math.floor(visibleItems / 2);

  // Generate items
  const items: number[] = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  // Get index from value
  const getIndexFromValue = useCallback((val: number) => {
    const idx = items.indexOf(val);
    return idx >= 0 ? idx : 0;
  }, [items]);

  // Get value from scroll position
  const getValueFromScrollPosition = useCallback((scrollTop: number) => {
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    return items[clampedIndex];
  }, [items, itemHeight]);

  // Scroll to specific index without triggering onChange
  const scrollToIndex = useCallback((index: number, smooth = false) => {
    if (!scrollRef.current) return;

    isProgrammaticScrollRef.current = true;
    const targetTop = index * itemHeight;

    if (smooth) {
      scrollRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      scrollRef.current.scrollTop = targetTop;
    }

    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, smooth ? 180 : 30);
  }, [itemHeight]);

  // Initialize scroll position
  useEffect(() => {
    const index = getIndexFromValue(value);
    scrollToIndex(index, false);
    lastValueRef.current = value;
    setSelectedValue(value);
  }, []); // Only on mount

  // Sync when value changes externally
  useEffect(() => {
    if (isScrollingRef.current) return;

    if (value !== lastValueRef.current) {
      const index = getIndexFromValue(value);
      scrollToIndex(index, false);
      lastValueRef.current = value;
      setSelectedValue(value);
    }
  }, [value, getIndexFromValue, scrollToIndex]);

  // Handle scroll with improved snapping
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    if (!scrollRef.current) return;

    isScrollingRef.current = true;

    // Clear existing timeout
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }

    const scrollTop = scrollRef.current.scrollTop;
    const newValue = getValueFromScrollPosition(scrollTop);
    setSelectedValue(newValue);

    if (newValue !== lastHapticValueRef.current) {
      triggerHaptic();
      lastHapticValueRef.current = newValue;
    }

    scrollEndTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;

      const currentScrollTop = scrollRef.current.scrollTop;
      const nearestIndex = Math.round(currentScrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
      const targetScrollTop = clampedIndex * itemHeight;
      const snappedValue = items[clampedIndex];

      isScrollingRef.current = false;
      if (snappedValue !== lastValueRef.current) {
        lastValueRef.current = snappedValue;
        setSelectedValue(snappedValue);
        onChange(snappedValue);
      }

      if (Math.abs(currentScrollTop - targetScrollTop) > 1) {
        scrollRef.current.scrollTo({ top: targetScrollTop, behavior: 'auto' });
      }
    }, 190);
  }, [getValueFromScrollPosition, onChange, itemHeight, items]);

  // Handle direct item click
  const handleItemClick = useCallback((item: number) => {
    const index = items.indexOf(item);
    if (index >= 0) {
      triggerHaptic();
      lastValueRef.current = item;
      setSelectedValue(item);
      onChange(item);
      scrollToIndex(index, true);
    }
  }, [items, onChange, scrollToIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  const containerHeight = visibleItems * itemHeight;
  const currentIndex = getIndexFromValue(selectedValue);

  return (
    <div className="relative mx-auto w-full" style={{ height: containerHeight }}>
      {/* Top gradient */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: paddingItems * itemHeight,
          background: 'linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 50%, transparent 100%)'
        }}
      />

      {/* Bottom gradient */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: paddingItems * itemHeight,
          background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 50%, transparent 100%)'
        }}
      />

      {/* Selection indicator */}
      <div
        className="absolute inset-x-2 z-0 pointer-events-none border-2 border-primary/50 bg-primary/10 rounded-xl"
        style={{
          top: paddingItems * itemHeight,
          height: itemHeight
        }}
      />

      {/* Scroll container - optimized for iOS and Android */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          scrollSnapType: 'y proximity',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollBehavior: 'auto',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          // Better performance on Android
          willChange: 'scroll-position',
          transform: 'translateZ(0)', // GPU acceleration
        } as React.CSSProperties}
        onScroll={handleScroll}
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * itemHeight }} />

        {/* Items */}
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          const distanceFromSelected = Math.abs(index - currentIndex);
          const opacity = distanceFromSelected === 0 ? 1 : distanceFromSelected === 1 ? 0.5 : 0.25;

          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none gap-1 transition-all duration-150 ${
                isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '1.5rem' : '1rem',
                opacity,
                transform: isSelected ? 'scale(1.05)' : 'scale(0.9)',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
              onClick={() => handleItemClick(item)}
            >
              <span>{item}</span>
              <span className={`${isSelected ? 'text-sm text-primary/70' : 'text-xs text-muted-foreground/60'}`}>
                {unit}
              </span>
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: paddingItems * itemHeight }} />
      </div>
    </div>
  );
};
