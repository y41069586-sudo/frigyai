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
    navigator.vibrate(3);
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
  const rafRef = useRef<number | null>(null);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUserScrolling = useRef(false);
  
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
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = index * itemHeight;
          lastValueRef.current = value;
          setIsInitialized(true);
        }
      });
    }
  }, [value, items, itemHeight, isInitialized]);

  // Sync scroll when value changes externally (not from user scrolling)
  useEffect(() => {
    if (!scrollRef.current || !isInitialized || isUserScrolling.current) return;
    
    const index = items.indexOf(value);
    if (index >= 0 && value !== lastValueRef.current) {
      scrollRef.current.scrollTop = index * itemHeight;
      lastValueRef.current = value;
    }
  }, [value, items, itemHeight, isInitialized]);

  // Get current value based on scroll position
  const getValueFromScroll = useCallback(() => {
    if (!scrollRef.current) return value;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    return items[clampedIndex];
  }, [items, itemHeight, value]);

  // Snap to nearest value after scroll ends
  const snapToNearestValue = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const targetScrollTop = clampedIndex * itemHeight;
    
    // Smooth snap to exact position
    scrollRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    isUserScrolling.current = false;
  }, [items, itemHeight]);

  // Live update on every scroll frame - iOS native behavior
  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    
    // Cancel previous animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Clear previous snap timeout
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    
    // Update value immediately during scroll
    rafRef.current = requestAnimationFrame(() => {
      const newValue = getValueFromScroll();
      
      if (newValue !== lastValueRef.current) {
        triggerHaptic();
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    });
    
    // Schedule snap after scroll ends
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    snapTimeoutRef.current = setTimeout(snapToNearestValue, isIOS ? 120 : 80);
  }, [getValueFromScroll, onChange, snapToNearestValue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
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
      isUserScrolling.current = true;
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
      lastValueRef.current = item;
      onChange(item);
      
      setTimeout(() => {
        isUserScrolling.current = false;
      }, 300);
    }
  }, [items, itemHeight, onChange]);

  // Force snap on touch end (for iOS momentum)
  const handleTouchEnd = useCallback(() => {
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    snapTimeoutRef.current = setTimeout(snapToNearestValue, 150);
  }, [snapToNearestValue]);

  const containerHeight = visibleItems * itemHeight;
  
  // Calculate visual state based on scroll position for live preview
  const currentScrollValue = getValueFromScroll();
  const currentIndex = items.indexOf(currentScrollValue);
  
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
      
      {/* Scroll container - iOS native feel */}
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
          const isSelected = index === currentIndex;
          const distanceFromSelected = Math.abs(index - currentIndex);
          const opacity = distanceFromSelected === 0 ? 1 : distanceFromSelected === 1 ? 0.5 : 0.25;
          
          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none cursor-pointer gap-1 transition-all duration-75 ${
                isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              style={{ 
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '1.5rem' : '1rem',
                opacity,
                transform: isSelected ? 'scale(1.05)' : 'scale(0.9)',
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
