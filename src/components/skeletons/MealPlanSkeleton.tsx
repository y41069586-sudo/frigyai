import { Skeleton } from "@/components/ui/skeleton";

export const MealPlanSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-12 w-20 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
