import { useState, useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
}

export const AnimatedCounter = ({ value, suffix = "" }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let start = displayValue;
    const duration = 250;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{displayValue}{suffix}</span>;
};
