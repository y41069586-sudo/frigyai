import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export const FoodAnalysisSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-6"
    >
      {/* Analyzing text with pulse */}
      <div className="text-center mb-6">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-lg font-semibold text-primary"
        >
          KI analysiert...
        </motion.div>
      </div>

      {/* Food name skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-xl bg-primary/20" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Macro cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {/* Calories */}
        <div className="bg-card/60 rounded-2xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-9 w-9 rounded-xl bg-orange-500/20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>

        {/* Protein */}
        <div className="bg-card/60 rounded-2xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-9 w-9 rounded-xl bg-red-500/20" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-7 w-16" />
        </div>

        {/* Carbs */}
        <div className="bg-card/60 rounded-2xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-9 w-9 rounded-xl bg-amber-500/20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-7 w-14" />
        </div>

        {/* Fat */}
        <div className="bg-card/60 rounded-2xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-9 w-9 rounded-xl bg-sky-500/20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-7 w-14" />
        </div>
      </div>

      {/* Scanning line animation */}
      <motion.div
        className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
};
