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
  min = 0,
  max = 500,
  unit = 'kg'
}: WeightPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const isScrollingRef = useRef(false);
  
  // Each 1 kg = one tick (smoother with fewer ticks)
  const tickWidth = 12;
  const totalTicks = max - min + 1;
  
  // Convert value to tick index
  const valueToTick = (v: number) => Math.round(v - min);
  const tickToValue = (tick: number) => min + tick;
  
  // Scroll to current value on mount
  useEffect(() => {
    if (scrollRef.current) {
      const tick = valueToTick(value);
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = tick * tickWidth - containerWidth / 2;
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, []);
  
  // Handle scroll - smooth continuous updates
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const containerWidth = scrollRef.current.clientWidth;
    const scrollLeft = scrollRef.current.scrollLeft;
    const centerPosition = scrollLeft + containerWidth / 2;
    
    // Calculate decimal value for smooth display
    const exactTick = centerPosition / tickWidth;
    const clampedTick = Math.max(0, Math.min(totalTicks - 1, exactTick));
    const newValue = min + clampedTick;
    const roundedValue = Math.round(newValue * 10) / 10;
    
    // Trigger haptic on whole number change
    const currentWhole = Math.floor(roundedValue);
    const lastWhole = Math.floor(lastValueRef.current);
    if (currentWhole !== lastWhole) {
      triggerHaptic();
    }
    
    lastValueRef.current = roundedValue;
    onChange(parseFloat(roundedValue.toFixed(1)));
  }, [onChange, min, totalTicks]);
  
  const onScroll = useCallback(() => {
    handleScroll();
  }, [handleScroll]);
  
  // Generate ticks - every 1kg
  const ticks = [];
  for (let i = 0; i < totalTicks; i++) {
    const tickValue = min + i;
    const isMajor = i % 10 === 0; // Every 10kg
    const isMid = i % 5 === 0 && !isMajor; // Every 5kg
    
    ticks.push(
      <div
        key={i}
        className="flex flex-col items-center flex-shrink-0"
        style={{ width: tickWidth }}
      >
        {/* Tick mark */}
        <div
          className={`w-0.5 rounded-full ${
            isMajor 
              ? 'h-10 bg-foreground' 
              : isMid 
                ? 'h-7 bg-muted-foreground/60' 
                : 'h-4 bg-muted-foreground/30'
          }`}
        />
        {/* Label for major ticks (every 10kg) */}
        {isMajor && (
          <span className="text-xs text-muted-foreground mt-1 font-medium">
            {tickValue}
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