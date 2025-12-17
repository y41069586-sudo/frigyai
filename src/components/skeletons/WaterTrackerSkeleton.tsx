import { Skeleton } from "@/components/ui/skeleton";

export const WaterTrackerSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Water Visual */}
      <div className="flex justify-center">
        <Skeleton className="h-48 w-32 rounded-3xl" />
      </div>

      {/* Progress Text */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>

      {/* Add Button */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Glass Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-lg mx-auto" />
        ))}
      </div>
    </div>
  );
};
