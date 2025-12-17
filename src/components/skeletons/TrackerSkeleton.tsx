import { Skeleton } from "@/components/ui/skeleton";

export const TrackerSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Calorie Circle */}
      <div className="flex flex-col items-center justify-center py-6">
        <Skeleton className="h-40 w-40 rounded-full" />
        <Skeleton className="h-4 w-32 mt-4" />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-4 border border-border/50">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-2 w-full mt-2 rounded-full" />
          </div>
        ))}
      </div>

      {/* Food Input */}
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Food Entries */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border/50 flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};
