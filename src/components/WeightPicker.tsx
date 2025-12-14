import { useRef, useEffect, useCallback } from 'react';

interface WeightPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

// iOS-style haptic feedback
const triggerHaptic = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(3);
    }
  } catch (e) {
    // Ignore vibration errors
  }
};

export const WeightPicker = ({
  value,
  onChange,
  min = 0,
  max = 300,
  unit = 'kg'
}: WeightPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const isInitialized = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout>();
  
  const itemHeight = 44; // iOS standard
  const visibleItems = 7;
  const containerHeight = visibleItems * itemHeight;
  const centerOffset = Math.floor(visibleItems / 2);
  
  // Generate items
  const items: number[] = [];
  for (let i = min; i <= max; i++) {
    items.push(i);
  }
  
  // Initial scroll to value
  useEffect(() => {
    if (scrollRef.current && !isInitialized.current) {
      isInitialized.current = true;
      const index = value - min;
      scrollRef.current.scrollTop = index * itemHeight;
    }
  }, [value, min]);
  
  // Handle scroll with immediate value update
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const rawIndex = scrollTop / itemHeight;
    const nearestIndex = Math.round(rawIndex);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
    const newValue = items[clampedIndex];
    
    // Update value immediately during scroll
    if (newValue !== lastValueRef.current) {
      triggerHaptic();
      lastValueRef.current = newValue;
      onChange(newValue);
    }
    
    // Snap to position after scroll ends
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
    }
    
    scrollEndTimeout.current = setTimeout(() => {
      if (scrollRef.current) {
        const finalScrollTop = scrollRef.current.scrollTop;
        const finalIndex = Math.round(finalScrollTop / itemHeight);
        const targetScrollTop = finalIndex * itemHeight;
        
        if (Math.abs(finalScrollTop - targetScrollTop) > 1) {
          scrollRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, 80);
  }, [items, onChange, itemHeight]);
  
  // Calculate item styles based on distance from center
  const getItemStyle = (item: number) => {
    const distance = Math.abs(item - value);
    
    if (distance === 0) {
      return {
        opacity: 1,
        transform: 'scale(1) rotateX(0deg)',
        fontWeight: 600,
        color: 'hsl(var(--primary))'
      };
    } else if (distance === 1) {
      return {
        opacity: 0.7,
        transform: 'scale(0.92) rotateX(15deg)',
        fontWeight: 500,
        color: 'hsl(var(--muted-foreground))'
      };
    } else if (distance === 2) {
      return {
        opacity: 0.4,
        transform: 'scale(0.85) rotateX(25deg)',
        fontWeight: 400,
        color: 'hsl(var(--muted-foreground))'
      };
    } else {
      return {
        opacity: 0.2,
        transform: 'scale(0.8) rotateX(35deg)',
        fontWeight: 400,
        color: 'hsl(var(--muted-foreground))'
      };
    }
  };
  
  return (
    <div className="relative mx-auto w-full max-w-xs">
      {/* Value display */}
      <div className="text-center mb-4">
        <span className="text-5xl font-bold text-foreground tabular-nums">
          {value}
        </span>
        <span className="text-2xl text-muted-foreground ml-2">{unit}</span>
      </div>
      
      {/* iOS-style picker */}
      <div 
        className="relative bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden"
        style={{ 
          height: containerHeight,
          perspective: '1000px'
        }}
      >
        {/* Top gradient overlay */}
        <div 
          className="absolute inset-x-0 top-0 z-20 pointer-events-none"
          style={{ 
            height: centerOffset * itemHeight,
            background: 'linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 30%, hsl(var(--card) / 0.5) 60%, transparent 100%)'
          }}
        />
        
        {/* Bottom gradient overlay */}
        <div 
          className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
          style={{ 
            height: centerOffset * itemHeight,
            background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 30%, hsl(var(--card) / 0.5) 60%, transparent 100%)'
          }}
        />
        
        {/* Center selection highlight */}
        <div 
          className="absolute inset-x-2 z-10 pointer-events-none rounded-xl"
          style={{ 
            top: centerOffset * itemHeight,
            height: itemHeight,
            background: 'hsl(var(--primary) / 0.08)',
            borderTop: '0.5px solid hsl(var(--primary) / 0.2)',
            borderBottom: '0.5px solid hsl(var(--primary) / 0.2)'
          }}
        />
        
        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide overscroll-contain"
          style={{ 
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            transformStyle: 'preserve-3d'
          }}
          onScroll={handleScroll}
        >
          {/* Top padding */}
          <div style={{ height: centerOffset * itemHeight }} />
          
          {/* Items */}
          {items.map((item) => {
            const style = getItemStyle(item);
            
            return (
              <div
                key={item}
                className="flex items-center justify-center select-none cursor-pointer"
                style={{ 
                  height: itemHeight,
                  scrollSnapAlign: 'center',
                  transform: style.transform,
                  opacity: style.opacity,
                  fontWeight: style.fontWeight,
                  color: style.color,
                  transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
                  transformOrigin: 'center center'
                }}
                onClick={() => {
                  if (scrollRef.current) {
                    const index = item - min;
                    scrollRef.current.scrollTo({
                      top: index * itemHeight,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <span 
                  className="tabular-nums"
                  style={{ 
                    fontSize: item === value ? '1.75rem' : '1.25rem',
                    transition: 'font-size 0.1s ease-out'
                  }}
                >
                  {item}
                </span>
              </div>
            );
          })}
          
          {/* Bottom padding */}
          <div style={{ height: centerOffset * itemHeight }} />
        </div>
      </div>
    </div>
  );
};
