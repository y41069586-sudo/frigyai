import { useRef, useEffect, useCallback, useState } from 'react';

interface WeightPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

// Haptic feedback function - iOS style
const triggerHaptic = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
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
  
  const itemHeight = 50; // iOS standard picker item height
  const visibleItems = 5;
  const containerHeight = visibleItems * itemHeight;
  const paddingItems = Math.floor(visibleItems / 2);
  
  // Generate items array
  const items: number[] = [];
  for (let i = min; i <= max; i++) {
    items.push(i);
  }
  
  const currentIndex = items.indexOf(value);
  
  // Scroll to current value on mount
  useEffect(() => {
    if (scrollRef.current && !hasInitialized.current && currentIndex >= 0) {
      hasInitialized.current = true;
      scrollRef.current.scrollTop = currentIndex * itemHeight;
    }
  }, [currentIndex]);
  
  // Handle scroll - snap to nearest item
  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    const newValue = items[clampedIndex];
    
    // Snap to position
    scrollRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth'
    });
    
    // Trigger haptic feedback when value changes
    if (newValue !== lastValueRef.current) {
      triggerHaptic();
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [items, onChange, itemHeight]);
  
  // Debounced scroll handler for end detection
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const onScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Update value during scroll for immediate feedback
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      const newValue = items[clampedIndex];
      
      if (newValue !== lastValueRef.current) {
        triggerHaptic();
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    }
    
    scrollTimeout.current = setTimeout(handleScrollEnd, 100);
  }, [handleScrollEnd, items, onChange, itemHeight]);
  
  return (
    <div className="relative mx-auto w-full max-w-xs">
      {/* Current value display */}
      <div className="text-center mb-4">
        <span className="text-5xl font-bold text-foreground">
          {value}
        </span>
        <span className="text-2xl text-muted-foreground ml-2">{unit}</span>
      </div>
      
      {/* iOS-style picker container */}
      <div 
        className="relative bg-card rounded-2xl overflow-hidden border border-border/50"
        style={{ height: containerHeight }}
      >
        {/* Top fade gradient */}
        <div 
          className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{ 
            height: paddingItems * itemHeight,
            background: 'linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.7) 50%, transparent 100%)'
          }}
        />
        
        {/* Bottom fade gradient */}
        <div 
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{ 
            height: paddingItems * itemHeight,
            background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.7) 50%, transparent 100%)'
          }}
        />
        
        {/* Center selection indicator - iOS style */}
        <div 
          className="absolute inset-x-4 z-0 pointer-events-none bg-primary/10 rounded-xl"
          style={{ 
            top: paddingItems * itemHeight,
            height: itemHeight,
            borderTop: '1px solid hsl(var(--primary) / 0.3)',
            borderBottom: '1px solid hsl(var(--primary) / 0.3)'
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
            const distance = Math.abs(item - value);
            const opacity = distance === 0 ? 1 : distance === 1 ? 0.6 : 0.3;
            const scale = distance === 0 ? 1 : distance === 1 ? 0.9 : 0.85;
            
            return (
              <div
                key={item}
                className="flex items-center justify-center select-none"
                style={{ 
                  height: itemHeight,
                  scrollSnapAlign: 'center',
                  transform: `scale(${scale})`,
                  opacity,
                  transition: 'transform 0.15s ease, opacity 0.15s ease'
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
                <span 
                  className={`font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                  style={{ fontSize: isSelected ? '2rem' : '1.5rem' }}
                >
                  {item}
                </span>
              </div>
            );
          })}
          
          {/* Bottom padding */}
          <div style={{ height: paddingItems * itemHeight }} />
        </div>
      </div>
    </div>
  );
};
