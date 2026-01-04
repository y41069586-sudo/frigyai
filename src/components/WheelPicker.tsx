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
    navigator.vibrate(1);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentValue, setCurrentValue] = useState(value);
  const lastValueRef = useRef(value);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);
  const velocityRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  
  const itemHeight = 40;
  const visibleItems = 5;
  const sensitivity = 0.15; // Lower = more items per swipe
  
  // Generate items
  const items: number[] = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  // Clamp value to valid range
  const clampValue = useCallback((val: number) => {
    const index = Math.round((val - min) / step);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    return items[clampedIndex];
  }, [min, step, items]);

  // Sync external value changes
  useEffect(() => {
    if (!isDraggingRef.current && value !== currentValue) {
      setCurrentValue(value);
      lastValueRef.current = value;
    }
  }, [value]);

  // Animate to final value with momentum
  const animateToValue = useCallback((targetValue: number, initialVelocity = 0) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    let currentVal = currentValue;
    let velocity = initialVelocity;
    const friction = 0.92;
    const target = clampValue(targetValue);

    const animate = () => {
      // Apply velocity
      if (Math.abs(velocity) > 0.1) {
        currentVal += velocity;
        velocity *= friction;
      }

      // Spring towards target
      const diff = target - currentVal;
      currentVal += diff * 0.15;

      // Clamp during animation
      const clampedVal = clampValue(currentVal);
      
      // Check if value changed for haptic
      if (clampedVal !== lastValueRef.current) {
        triggerHaptic();
        lastValueRef.current = clampedVal;
        onChange(clampedVal);
      }
      
      setCurrentValue(currentVal);

      // Continue animation if not settled
      if (Math.abs(diff) > 0.01 || Math.abs(velocity) > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(target);
        if (target !== lastValueRef.current) {
          lastValueRef.current = target;
          onChange(target);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [currentValue, clampValue, onChange]);

  // Touch/Mouse handlers
  const handleStart = useCallback((clientY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startValueRef.current = currentValue;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, [currentValue]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;

    const deltaY = startYRef.current - clientY;
    const deltaValue = deltaY * sensitivity;
    const newValue = startValueRef.current + deltaValue;
    
    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (lastYRef.current - clientY) * sensitivity / dt * 16;
    }
    lastYRef.current = clientY;
    lastTimeRef.current = now;

    // Apply rubber-band effect at edges
    let displayValue = newValue;
    if (newValue < min) {
      displayValue = min - (min - newValue) * 0.3;
    } else if (newValue > max) {
      displayValue = max + (newValue - max) * 0.3;
    }

    setCurrentValue(displayValue);

    // Check for value change haptic
    const snappedValue = clampValue(displayValue);
    if (snappedValue !== lastValueRef.current) {
      triggerHaptic();
      lastValueRef.current = snappedValue;
      onChange(snappedValue);
    }
  }, [min, max, sensitivity, clampValue, onChange]);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Calculate target with momentum
    const momentumValue = currentValue + velocityRef.current * 10;
    animateToValue(momentumValue, velocityRef.current);
  }, [currentValue, animateToValue]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleMouseUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Click on item
  const handleItemClick = (item: number) => {
    triggerHaptic();
    animateToValue(item);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const containerHeight = visibleItems * itemHeight;
  const centerOffset = (visibleItems - 1) / 2;

  // Render items with 3D effect
  const renderItems = () => {
    const currentIndex = (currentValue - min) / step;
    
    return items.map((item, index) => {
      const offset = index - currentIndex;
      const absOffset = Math.abs(offset);
      
      // iOS-style 3D barrel effect
      const rotateX = offset * 22;
      const translateZ = -Math.abs(offset) * 5;
      const scale = 1 - absOffset * 0.08;
      const opacity = absOffset > 2 ? 0 : 1 - absOffset * 0.3;
      
      // Only render visible items
      if (absOffset > 3) return null;
      
      const isSelected = absOffset < 0.5;
      
      return (
        <div
          key={item}
          className="absolute left-0 right-0 flex items-center justify-center cursor-pointer select-none"
          style={{
            height: itemHeight,
            top: '50%',
            transform: `
              translateY(${offset * itemHeight - itemHeight / 2}px)
              perspective(1000px)
              rotateX(${rotateX}deg)
              translateZ(${translateZ}px)
              scale(${scale})
            `,
            opacity,
            transition: isDraggingRef.current ? 'none' : 'opacity 0.1s',
          }}
          onClick={() => handleItemClick(item)}
        >
          <span
            className={`tabular-nums ${
              isSelected 
                ? 'text-foreground font-semibold text-xl' 
                : 'text-muted-foreground/70 text-lg'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            {item}
            {unit && (
              <span className={`ml-1 ${isSelected ? 'text-muted-foreground text-base' : 'text-muted-foreground/50 text-sm'}`}>
                {unit}
              </span>
            )}
          </span>
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full overflow-hidden touch-none"
      style={{ height: containerHeight }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* iOS-style selection indicator lines */}
      <div
        className="absolute left-4 right-4 pointer-events-none border-t border-b border-muted-foreground/20"
        style={{
          top: centerOffset * itemHeight,
          height: itemHeight,
        }}
      />
      
      {/* Top fade gradient */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: centerOffset * itemHeight,
          background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 50%, transparent 100%)',
        }}
      />
      
      {/* Bottom fade gradient */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: centerOffset * itemHeight,
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 50%, transparent 100%)',
        }}
      />
      
      {/* Items container */}
      <div className="relative h-full">
        {renderItems()}
      </div>
    </div>
  );
};
