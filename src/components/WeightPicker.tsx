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
  const wholeRef = useRef<HTMLDivElement>(null);
  const decimalRef = useRef<HTMLDivElement>(null);
  const lastWholeRef = useRef(Math.floor(value));
  const lastDecimalRef = useRef(Math.round((value % 1) * 10));
  
  const itemHeight = 44;
  const visibleItems = 5;
  const paddingItems = Math.floor(visibleItems / 2);
  
  // Generate whole numbers (40-200)
  const wholeNumbers: number[] = [];
  for (let i = min; i <= max; i++) {
    wholeNumbers.push(i);
  }
  
  // Generate decimals (0-9)
  const decimals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  const currentWhole = Math.floor(value);
  const currentDecimal = Math.round((value % 1) * 10);
  
  // Scroll to current value on mount
  useEffect(() => {
    const wholeIndex = wholeNumbers.indexOf(currentWhole);
    const decimalIndex = decimals.indexOf(currentDecimal);
    
    if (wholeRef.current && wholeIndex >= 0) {
      wholeRef.current.scrollTop = wholeIndex * itemHeight;
    }
    if (decimalRef.current && decimalIndex >= 0) {
      decimalRef.current.scrollTop = decimalIndex * itemHeight;
    }
  }, []);
  
  // Handle whole number scroll
  const handleWholeScroll = useCallback(() => {
    if (!wholeRef.current) return;
    
    const scrollTop = wholeRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(wholeNumbers.length - 1, index));
    const newWhole = wholeNumbers[clampedIndex];
    
    if (newWhole !== lastWholeRef.current) {
      triggerHaptic();
      lastWholeRef.current = newWhole;
      const decimal = lastDecimalRef.current / 10;
      onChange(newWhole + decimal);
    }
  }, [wholeNumbers, onChange]);
  
  // Handle decimal scroll
  const handleDecimalScroll = useCallback(() => {
    if (!decimalRef.current) return;
    
    const scrollTop = decimalRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(decimals.length - 1, index));
    const newDecimal = decimals[clampedIndex];
    
    if (newDecimal !== lastDecimalRef.current) {
      triggerHaptic();
      lastDecimalRef.current = newDecimal;
      const whole = lastWholeRef.current;
      onChange(whole + newDecimal / 10);
    }
  }, [decimals, onChange]);
  
  // Debounced scroll handlers
  const wholeTimeout = useRef<NodeJS.Timeout>();
  const decimalTimeout = useRef<NodeJS.Timeout>();
  
  const onWholeScroll = useCallback(() => {
    if (wholeTimeout.current) clearTimeout(wholeTimeout.current);
    wholeTimeout.current = setTimeout(handleWholeScroll, 50);
  }, [handleWholeScroll]);
  
  const onDecimalScroll = useCallback(() => {
    if (decimalTimeout.current) clearTimeout(decimalTimeout.current);
    decimalTimeout.current = setTimeout(handleDecimalScroll, 50);
  }, [handleDecimalScroll]);
  
  const containerHeight = visibleItems * itemHeight;
  
  const renderColumn = (
    ref: React.RefObject<HTMLDivElement>,
    items: number[],
    currentValue: number,
    onScroll: () => void,
    showLeadingZero = false
  ) => (
    <div 
      ref={ref}
      className="h-full overflow-y-auto scrollbar-hide flex-1"
      style={{ 
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch'
      }}
      onScroll={onScroll}
    >
      {/* Top padding */}
      <div style={{ height: paddingItems * itemHeight }} />
      
      {/* Items */}
      {items.map((item) => {
        const isSelected = item === currentValue;
        return (
          <div
            key={item}
            className={`flex items-center justify-center select-none transition-all duration-150 ${
              isSelected ? 'text-foreground font-bold' : 'text-muted-foreground/40'
            }`}
            style={{ 
              height: itemHeight,
              scrollSnapAlign: 'center',
              fontSize: isSelected ? '2.25rem' : '1.5rem'
            }}
            onClick={() => {
              if (ref.current) {
                const index = items.indexOf(item);
                ref.current.scrollTo({
                  top: index * itemHeight,
                  behavior: 'smooth'
                });
              }
            }}
          >
            {showLeadingZero ? item : item}
          </div>
        );
      })}
      
      {/* Bottom padding */}
      <div style={{ height: paddingItems * itemHeight }} />
    </div>
  );
  
  return (
    <div className="relative mx-auto max-w-xs">
      {/* Top fade gradient */}
      <div 
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ 
          height: paddingItems * itemHeight,
          background: 'linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)'
        }}
      />
      
      {/* Bottom fade gradient */}
      <div 
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ 
          height: paddingItems * itemHeight,
          background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)'
        }}
      />
      
      {/* Center selection indicator */}
      <div 
        className="absolute inset-x-2 z-0 pointer-events-none border-y border-primary/30 bg-primary/5 rounded-xl"
        style={{ 
          top: paddingItems * itemHeight,
          height: itemHeight 
        }}
      />
      
      {/* Picker columns container */}
      <div 
        className="flex items-center"
        style={{ height: containerHeight }}
      >
        {/* Whole numbers column */}
        {renderColumn(wholeRef, wholeNumbers, currentWhole, onWholeScroll)}
        
        {/* Decimal separator */}
        <div className="text-3xl font-bold text-foreground px-1 self-center" style={{ marginTop: -2 }}>
          ,
        </div>
        
        {/* Decimal column */}
        <div className="w-16">
          {renderColumn(decimalRef, decimals, currentDecimal, onDecimalScroll, true)}
        </div>
        
        {/* Unit */}
        <div className="text-xl text-muted-foreground ml-2 self-center">
          {unit}
        </div>
      </div>
    </div>
  );
};
