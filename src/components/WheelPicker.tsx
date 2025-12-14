import { useRef, useEffect, useCallback } from 'react';

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export const WheelPicker = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = ''
}: WheelPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44; // iOS standard height
  const visibleItems = 5;
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
  
  // Handle scroll end - snap to nearest item
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    
    if (items[clampedIndex] !== value) {
      onChange(items[clampedIndex]);
    }
  }, [items, value, onChange, itemHeight]);
  
  // Debounced scroll handler
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const onScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(handleScroll, 50);
  }, [handleScroll]);
  
  const containerHeight = visibleItems * itemHeight;
  
  return (
    <div className="relative mx-auto" style={{ height: containerHeight }}>
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
        className="absolute inset-x-4 z-0 pointer-events-none border-y border-primary/40 bg-primary/10 rounded-lg"
        style={{ 
          top: paddingItems * itemHeight,
          height: itemHeight 
        }}
      />
      
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-hide"
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
          const isSelected = item === value;
          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none transition-all duration-150 ${
                isSelected ? 'text-primary font-semibold scale-100' : 'text-muted-foreground/60 scale-95'
              }`}
              style={{ 
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '1.75rem' : '1.25rem'
              }}
              onClick={() => {
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
              {unit && isSelected && (
                <span className="text-base text-muted-foreground ml-2">{unit}</span>
              )}
            </div>
          );
        })}
        
        {/* Bottom padding */}
        <div style={{ height: paddingItems * itemHeight }} />
      </div>
    </div>
  );
};
