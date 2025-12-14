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
    // Ignore
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
  
  const tickSpacing = 8; // Pixels between each kg
  const totalTicks = max - min + 1;
  
  // Scroll to current value on mount
  useEffect(() => {
    if (scrollRef.current && !isInitialized.current) {
      isInitialized.current = true;
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = (value - min) * tickSpacing - containerWidth / 2;
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, [value, min]);
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const containerWidth = scrollRef.current.clientWidth;
    const scrollLeft = scrollRef.current.scrollLeft;
    const centerPosition = scrollLeft + containerWidth / 2;
    
    const rawValue = centerPosition / tickSpacing + min;
    const newValue = Math.round(Math.max(min, Math.min(max, rawValue)));
    
    // Update value and trigger haptic
    if (newValue !== lastValueRef.current) {
      triggerHaptic();
      lastValueRef.current = newValue;
      onChange(newValue);
    }
    
    // Snap after scroll ends
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
    }
    
    scrollEndTimeout.current = setTimeout(() => {
      if (scrollRef.current) {
        const currentScrollLeft = scrollRef.current.scrollLeft;
        const currentCenter = currentScrollLeft + containerWidth / 2;
        const currentValue = Math.round(currentCenter / tickSpacing + min);
        const targetScrollLeft = (currentValue - min) * tickSpacing - containerWidth / 2;
        
        if (Math.abs(currentScrollLeft - targetScrollLeft) > 1) {
          scrollRef.current.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  }, [min, max, onChange, tickSpacing]);
  
  // Generate tick marks
  const ticks = [];
  for (let i = 0; i < totalTicks; i++) {
    const tickValue = min + i;
    const isMajor = tickValue % 10 === 0;
    const isMid = tickValue % 5 === 0 && !isMajor;
    
    ticks.push(
      <div
        key={i}
        className="flex flex-col items-center flex-shrink-0"
        style={{ width: tickSpacing }}
      >
        <div
          className={`rounded-full ${
            isMajor 
              ? 'w-0.5 h-8 bg-foreground' 
              : isMid 
                ? 'w-0.5 h-5 bg-muted-foreground/70' 
                : 'w-px h-3 bg-muted-foreground/40'
          }`}
        />
        {isMajor && (
          <span className="text-[10px] text-muted-foreground mt-1 font-medium tabular-nums">
            {tickValue}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Current value display */}
      <div className="text-center mb-3">
        <span className="text-5xl font-bold text-foreground tabular-nums">
          {value}
        </span>
        <span className="text-2xl text-muted-foreground ml-2">{unit}</span>
      </div>
      
      {/* Ruler container */}
      <div className="relative h-20 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        {/* Left fade */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to right, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)'
          }}
        />
        
        {/* Right fade */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to left, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)'
          }}
        />
        
        {/* Center indicator triangle */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div 
            className="w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid hsl(var(--primary))'
            }}
          />
        </div>
        
        {/* Center indicator line */}
        <div 
          className="absolute left-1/2 top-2 bottom-3 w-0.5 bg-primary z-20 -translate-x-1/2 rounded-full"
        />
        
        {/* Scrollable ruler */}
        <div
          ref={scrollRef}
          className="h-full overflow-x-auto scrollbar-hide flex items-end pb-3 overscroll-x-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity'
          }}
          onScroll={handleScroll}
        >
          {/* Left padding to center 0 */}
          <div className="flex-shrink-0" style={{ width: '50%' }} />
          
          {/* Tick marks */}
          {ticks}
          
          {/* Right padding to center max */}
          <div className="flex-shrink-0" style={{ width: '50%' }} />
        </div>
      </div>
    </div>
  );
};
