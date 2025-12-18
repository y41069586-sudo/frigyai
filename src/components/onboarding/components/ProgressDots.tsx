interface ProgressDotsProps {
  current: number;
  total: number;
}

export const ProgressDots = ({ current, total }: ProgressDotsProps) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current 
            ? "w-6 bg-primary" 
            : i < current 
              ? "w-1.5 bg-primary/40" 
              : "w-1.5 bg-muted"
        }`}
      />
    ))}
  </div>
);
