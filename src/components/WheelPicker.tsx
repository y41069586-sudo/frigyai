import { useRef, useEffect, useCallback, useState } from 'react';

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

// Enhanced haptic feedback function
const triggerHaptic = (intensity: 'light' | 'medium' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(intensity === 'light' ? 3 : 8);
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const itemHeight = 48; // Slightly larger for mobile
  const visibleItems = 3; // Reduced for compact display
  const items: number[] = [];
  
  // Generate items array
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }
  
  const currentIndex = items.indexOf(value);
  const paddingItems = Math.floor(visibleItems / 2);
  
  // Scroll to current value on mount
  useEffect(() => {
    if (scrollRef.current && currentIndex >= 0) {
      scrollRef.current.scrollTop = currentIndex * itemHeight;
    }
  }, []);

  // Update display value in real-time while scrolling
  const updateDisplayValue = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const newValue = items[clampedIndex];
    
    // Update display immediately while scrolling
    if (newValue !== displayValue) {
      setDisplayValue(newValue);
      // Trigger light haptic for each value change
      if (newValue !== lastValueRef.current) {
        triggerHaptic('light');
      }
    }
  }, [items, itemHeight, displayValue]);
  
  // Handle scroll end - snap to nearest item and confirm selection
  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const newValue = items[clampedIndex];
    
    // Snap to exact position
    scrollRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth'
    });
    
    // Confirm value change
    if (newValue !== lastValueRef.current) {
      triggerHaptic('medium');
      lastValueRef.current = newValue;
      onChange(newValue);
    }
    
    setIsScrolling(false);
  }, [items, onChange, itemHeight]);
  
  // Scroll event handlers
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const scrollUpdateInterval = useRef<NodeJS.Timeout>();
  
  const onScrollStart = useCallback(() => {
    setIsScrolling(true);
    
    // Clear existing intervals
    if (scrollUpdateInterval.current) {
      clearInterval(scrollUpdateInterval.current);
    }
    
    // Update display value frequently while scrolling
    scrollUpdateInterval.current = setInterval(updateDisplayValue, 16);
  }, [updateDisplayValue]);
  
  const onScroll = useCallback(() => {
    if (!isScrolling) {
      onScrollStart();
    }
    
    // Update display value immediately
    updateDisplayValue();
    
    // Debounce the scroll end
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      if (scrollUpdateInterval.current) {
        clearInterval(scrollUpdateInterval.current);
      }
      handleScrollEnd();
    }, 100);
  }, [isScrolling, onScrollStart, updateDisplayValue, handleScrollEnd]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (scrollUpdateInterval.current) clearInterval(scrollUpdateInterval.current);
    };
  }, []);
  
  const containerHeight = visibleItems * itemHeight;
  
  return (
    <div className="relative mx-auto w-full" style={{ height: containerHeight }}>
      {/* Top fade gradient */}
      <div 
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ 
          height: paddingItems * itemHeight,
          background: 'linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.6) 60%, transparent 100%)'
        }}
      />
      
      {/* Bottom fade gradient */}
      <div 
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ 
          height: paddingItems * itemHeight,
          background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.6) 60%, transparent 100%)'
        }}
      />
      
      {/* Center selection indicator */}
      <div 
        className="absolute inset-x-2 z-0 pointer-events-none border-y-2 border-primary/50 bg-primary/10 rounded-lg"
        style={{ 
          top: paddingItems * itemHeight,
          height: itemHeight 
        }}
      />
      
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-hide touch-pan-y"
        style={{ 
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={onScroll}
        onTouchStart={onScrollStart}
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * itemHeight }} />
        
        {/* Items */}
        {items.map((item) => {
          const isSelected = item === displayValue;
          const distance = Math.abs(items.indexOf(item) - items.indexOf(displayValue));
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
          
          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none transition-all duration-100 gap-1 ${
                isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              style={{ 
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '1.5rem' : '1.1rem',
                opacity,
                transform: isSelected ? 'scale(1.05)' : 'scale(0.95)'
              }}
              onClick={() => {
                triggerHaptic('medium');
                if (scrollRef.current) {
                  const index = items.indexOf(item);
                  scrollRef.current.scrollTo({
                    top: index * itemHeight,
                    behavior: 'smooth'
                  });
                }
              }}
            >
              <span>{item}</span>
              <span className={`text-sm ${isSelected ? 'text-primary/70' : 'text-muted-foreground/50'}`}>
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
