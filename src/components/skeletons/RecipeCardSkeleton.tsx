import { Skeleton } from "@/components/ui/skeleton";

export const RecipeCardSkeleton = () => {
  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      {/* Ingredients */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
};
