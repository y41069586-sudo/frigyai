import { useRef, useEffect, useCallback, useState } from 'react';

interface WeightPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

// Haptic feedback function - more reliable
const triggerHaptic = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
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
  const hasInitialized = useRef(false);
  
  const tickWidth = 12;
  const totalTicks = max - min + 1;
  
  // Scroll to current value on mount
  useEffect(() => {
    if (scrollRef.current && !hasInitialized.current) {
      hasInitialized.current = true;
      const tick = Math.round(value - min);
      const containerWidth = scrollRef.current.clientWidth;
      const scrollLeft = tick * tickWidth - containerWidth / 2 + tickWidth / 2;
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, [value, min]);
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const containerWidth = scrollRef.current.clientWidth;
    const scrollLeft = scrollRef.current.scrollLeft;
    const centerPosition = scrollLeft + containerWidth / 2;
    
    const exactTick = centerPosition / tickWidth;
    const clampedTick = Math.max(0, Math.min(totalTicks - 1, Math.round(exactTick)));
    const newValue = min + clampedTick;
    
    // Trigger haptic on value change
    if (newValue !== lastValueRef.current) {
      triggerHaptic();
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [onChange, min, totalTicks]);
  
  // Generate all ticks (301 is acceptable for performance)
  const ticks = [];
  for (let i = 0; i < totalTicks; i++) {
    const tickValue = min + i;
    const isMajor = tickValue % 10 === 0;
    const isMid = tickValue % 5 === 0 && !isMajor;
    
    ticks.push(
      <div
        key={i}
        className="flex flex-col items-center flex-shrink-0"
        style={{ width: tickWidth }}
      >
        <div
          className={`w-0.5 rounded-full ${
            isMajor 
              ? 'h-10 bg-foreground' 
              : isMid 
                ? 'h-7 bg-muted-foreground/60' 
                : 'h-4 bg-muted-foreground/30'
          }`}
        />
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
          {value}
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
        
        {/* Center indicator */}
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
        
        <div 
          className="absolute left-1/2 top-2.5 bottom-0 w-0.5 bg-primary z-20 transform -translate-x-1/2"
        />
        
        {/* Scrollable ruler */}
        <div
          ref={scrollRef}
          className="h-full overflow-x-auto scrollbar-hide flex items-end pb-4"
          style={{
            WebkitOverflowScrolling: 'touch'
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