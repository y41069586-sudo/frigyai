import { useRef, useEffect, useCallback } from 'react';

interface WeightPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

// Haptic feedback function
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(3);
  }
};

export const WeightPicker = ({
  value,
  onChange,
  min = 40,
  max = 200,
  unit = 'kg'
}: WeightPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  
  // Each 0.1 kg = one tick
  const tickWidth = 8; // Width per tick in pixels
  const totalTicks = (max - min) * 10 + 1; // e.g., 40.0 to 200.0
  
  // Convert value to tick index
  const valueToTick = (v: number) => Math.round((v - min) * 10);
  const tickToValue = (tick: number) => min + tick / 10;
  
  // Scroll to current value on mount
  useEffect(() => {
    if (scrollRef.current) {
      const tick = valueToTick(value);
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = tick * tickWidth - containerWidth / 2;
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, []);
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const containerWidth = scrollRef.current.clientWidth;
    const scrollLeft = scrollRef.current.scrollLeft;
    const centerPosition = scrollLeft + containerWidth / 2;
    const tick = Math.round(centerPosition / tickWidth);
    const clampedTick = Math.max(0, Math.min(totalTicks - 1, tick));
    const newValue = tickToValue(clampedTick);
    
    if (Math.abs(newValue - lastValueRef.current) >= 0.1) {
      triggerHaptic();
      lastValueRef.current = newValue;
      onChange(parseFloat(newValue.toFixed(1)));
    }
  }, [onChange, min, totalTicks]);
  
  // Debounced scroll handler
  const scrollTimeout = useRef<NodeJS.Timeout>();
  
  const onScroll = useCallback(() => {
    handleScroll();
    
    // Snap to nearest value when scrolling stops
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = scrollRef.current.scrollLeft;
      const centerPosition = scrollLeft + containerWidth / 2;
      const tick = Math.round(centerPosition / tickWidth);
      const clampedTick = Math.max(0, Math.min(totalTicks - 1, tick));
      const targetScroll = clampedTick * tickWidth - containerWidth / 2;
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }, 100);
  }, [handleScroll, totalTicks]);
  
  // Generate ticks
  const ticks = [];
  for (let i = 0; i < totalTicks; i++) {
    const tickValue = min + i / 10;
    const isWhole = i % 10 === 0;
    const isHalf = i % 5 === 0 && !isWhole;
    
    ticks.push(
      <div
        key={i}
        className="flex flex-col items-center flex-shrink-0"
        style={{ width: tickWidth }}
      >
        {/* Tick mark */}
        <div
          className={`w-0.5 rounded-full ${
            isWhole 
              ? 'h-10 bg-foreground' 
              : isHalf 
                ? 'h-6 bg-muted-foreground/60' 
                : 'h-4 bg-muted-foreground/30'
          }`}
        />
        {/* Label for whole numbers */}
        {isWhole && (
          <span className="text-xs text-muted-foreground mt-1 font-medium">
            {Math.round(tickValue)}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Current value display */}
      <div className="text-center mb-4">
        <span className="text-5xl font-bold text-foreground">
          {value.toFixed(1).replace('.', ',')}
        </span>
        <span className="text-2xl text-muted-foreground ml-2">{unit}</span>
      </div>
      
      {/* Ruler container */}
      <div className="relative h-24 bg-card rounded-2xl overflow-hidden border border-border/50">
        {/* Left fade gradient */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to right, hsl(var(--card)) 0%, transparent 100%)'
          }}
        />
        
        {/* Right fade gradient */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to left, hsl(var(--card)) 0%, transparent 100%)'
          }}
        />
        
        {/* Center indicator - triangle pointer */}
        <div className="absolute left-1/2 top-0 z-20 transform -translate-x-1/2">
          <div 
            className="w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid hsl(var(--primary))'
            }}
          />
        </div>
        
        {/* Center line */}
        <div 
          className="absolute left-1/2 top-2.5 bottom-0 w-0.5 bg-primary z-20 transform -translate-x-1/2"
        />
        
        {/* Scrollable ruler */}
        <div
          ref={scrollRef}
          className="h-full overflow-x-auto scrollbar-hide flex items-end pb-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity'
          }}
          onScroll={onScroll}
        >
          {/* Left padding to center first value */}
          <div className="flex-shrink-0" style={{ width: '50%' }} />
          
          {/* Tick marks */}
          {ticks}
          
          {/* Right padding to center last value */}
          <div className="flex-shrink-0" style={{ width: '50%' }} />
        </div>
      </div>
    </div>
  );
};