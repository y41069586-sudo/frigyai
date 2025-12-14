import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  itemHeight?: number;
  visibleItems?: number;
}

export const WheelPicker = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  itemHeight = 50,
  visibleItems = 5
}: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = [];
  
  // Generate items array
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }
  
  const currentIndex = items.indexOf(value);
  const y = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate center offset
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;
  
  // Set initial position
  useEffect(() => {
    if (!isDragging) {
      const targetY = -currentIndex * itemHeight;
      animate(y, targetY, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [currentIndex, itemHeight, isDragging]);
  
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const currentY = y.get();
    const velocity = info.velocity.y;
    
    // Calculate target index based on position and velocity
    let targetIndex = Math.round(-currentY / itemHeight);
    
    // Add momentum from velocity
    if (Math.abs(velocity) > 500) {
      targetIndex += velocity > 0 ? -1 : 1;
    }
    
    // Clamp to valid range
    targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
    
    const targetY = -targetIndex * itemHeight;
    animate(y, targetY, { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30,
      onComplete: () => {
        if (items[targetIndex] !== value) {
          onChange(items[targetIndex]);
        }
      }
    });
  }, [y, itemHeight, items, value, onChange]);
  
  const containerHeight = visibleItems * itemHeight;
  
  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden mx-auto"
      style={{ height: containerHeight, width: '100%' }}
    >
      {/* Gradient overlays for fade effect */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
      
      {/* Center highlight */}
      <div 
        className="absolute inset-x-4 border-y-2 border-primary/30 bg-primary/5 z-0 pointer-events-none rounded-lg"
        style={{ 
          top: centerOffset - itemHeight / 2,
          height: itemHeight 
        }}
      />
      
      {/* Scrollable items */}
      <motion.div
        className="flex flex-col items-center cursor-grab active:cursor-grabbing"
        style={{ 
          y,
          paddingTop: centerOffset - itemHeight / 2,
          paddingBottom: centerOffset - itemHeight / 2
        }}
        drag="y"
        dragConstraints={{ 
          top: -(items.length - 1) * itemHeight - 20,
          bottom: 20 
        }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {items.map((item, index) => {
          const isSelected = item === value;
          return (
            <motion.div
              key={item}
              className={`flex items-center justify-center select-none transition-colors ${
                isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
              style={{ 
                height: itemHeight,
                fontSize: isSelected ? '2.5rem' : '1.5rem',
                opacity: isSelected ? 1 : 0.5
              }}
              onClick={() => {
                if (!isDragging) {
                  const targetY = -index * itemHeight;
                  animate(y, targetY, { 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    onComplete: () => onChange(item)
                  });
                }
              }}
            >
              <span>{item}</span>
              {unit && isSelected && (
                <span className="text-lg text-muted-foreground ml-2">{unit}</span>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
