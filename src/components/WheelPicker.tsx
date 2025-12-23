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
  const isScrollingRef = useRef(false);
  const lastValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const itemHeight = 48;
  const visibleItems = 3;
  const paddingItems = Math.floor(visibleItems / 2);
  
  // Generate items
  const items: number[] = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  // Initial scroll position - only once
  useEffect(() => {
    if (!scrollRef.current || isInitialized) return;
    
    const index = items.indexOf(value);
    if (index >= 0) {
      // Use requestAnimationFrame for smoother initial positioning
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = index * itemHeight;
          lastValueRef.current = value;
          setIsInitialized(true);
        }
      });
    }
  }, [value, items, itemHeight, isInitialized]);

  // Sync scroll when value changes externally (not from scrolling)
  useEffect(() => {
    if (!scrollRef.current || !isInitialized || isScrollingRef.current) return;
    
    const index = items.indexOf(value);
    if (index >= 0 && value !== lastValueRef.current) {
      scrollRef.current.scrollTop = index * itemHeight;
      lastValueRef.current = value;
    }
  }, [value, items, itemHeight, isInitialized]);

  const snapToValue = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const targetScrollTop = clampedIndex * itemHeight;
    const newValue = items[clampedIndex];
    
    // Smooth snap to position
    scrollRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    // Update value if changed
    if (newValue !== lastValueRef.current) {
      triggerHaptic();
      lastValueRef.current = newValue;
      onChange(newValue);
    }
    
    isScrollingRef.current = false;
  }, [items, onChange, itemHeight]);

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    
    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Use longer timeout for iOS to ensure scroll momentum has finished
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const scrollEndDelay = isIOS ? 150 : 100;
    
    scrollTimeoutRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(snapToValue);
    }, scrollEndDelay);
  }, [snapToValue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  const handleItemClick = useCallback((item: number) => {
    const index = items.indexOf(item);
    if (scrollRef.current && index >= 0) {
      triggerHaptic();
      isScrollingRef.current = true;
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
      lastValueRef.current = item;
      onChange(item);
      
      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);
    }
  }, [items, itemHeight, onChange]);

  // Handle touch end for iOS - ensure snap happens
  const handleTouchEnd = useCallback(() => {
    // Clear existing timeout and set a new one
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Longer delay for touch end to handle momentum
    scrollTimeoutRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(snapToValue);
    }, 200);
  }, [snapToValue]);
  
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
      
      {/* Scroll container - iOS optimized */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{ 
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y'
        }}
        onScroll={handleScroll}
        onTouchEnd={handleTouchEnd}
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
                transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
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
