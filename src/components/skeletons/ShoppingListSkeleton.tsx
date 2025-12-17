import { Skeleton } from "@/components/ui/skeleton";

export const ShoppingListSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Categories */}
      {[1, 2, 3].map((category) => (
        <div key={category} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item} 
                className="bg-card rounded-xl p-4 border border-border/50 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
