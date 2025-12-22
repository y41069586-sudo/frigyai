import { useRef, useEffect, useCallback } from 'react';

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
    navigator.vibrate(5);
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
  const isUserScrolling = useRef(false);
  const lastSelectedValue = useRef(value);
  const scrollEndTimer = useRef<number | null>(null);
  
  const itemHeight = 48;
  const visibleItems = 3;
  const paddingItems = Math.floor(visibleItems / 2);
  
  // Generate items
  const items: number[] = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }
  
  // Sync scroll position when value changes externally
  useEffect(() => {
    if (!scrollRef.current || isUserScrolling.current) return;
    
    const index = items.indexOf(value);
    if (index >= 0) {
      scrollRef.current.scrollTop = index * itemHeight;
      lastSelectedValue.current = value;
    }
  }, [value, items, itemHeight]);

  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const newValue = items[clampedIndex];
    
    // Snap to position
    scrollRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth'
    });
    
    // Update value if changed
    if (newValue !== lastSelectedValue.current) {
      triggerHaptic();
      lastSelectedValue.current = newValue;
      onChange(newValue);
    }
    
    isUserScrolling.current = false;
  }, [items, onChange, itemHeight]);

  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    
    // Clear previous timer
    if (scrollEndTimer.current) {
      window.clearTimeout(scrollEndTimer.current);
    }
    
    // Set new timer for scroll end detection
    scrollEndTimer.current = window.setTimeout(handleScrollEnd, 120);
  }, [handleScrollEnd]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollEndTimer.current) {
        window.clearTimeout(scrollEndTimer.current);
      }
    };
  }, []);
  
  const handleItemClick = (item: number) => {
    const index = items.indexOf(item);
    if (scrollRef.current && index >= 0) {
      triggerHaptic();
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
      lastSelectedValue.current = item;
      onChange(item);
    }
  };
  
  const containerHeight = visibleItems * itemHeight;
  const currentIndex = items.indexOf(value);
  
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
      
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide overscroll-contain"
        style={{ 
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={handleScroll}
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * itemHeight }} />
        
        {/* Items */}
        {items.map((item, index) => {
          const isSelected = item === value;
          const distanceFromSelected = Math.abs(index - currentIndex);
          const opacity = distanceFromSelected === 0 ? 1 : distanceFromSelected === 1 ? 0.5 : 0.25;
          
          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none cursor-pointer gap-1 ${
                isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              style={{ 
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '1.5rem' : '1rem',
                opacity,
                transform: isSelected ? 'scale(1.05)' : 'scale(0.9)',
                transition: 'opacity 0.1s, transform 0.1s'
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
