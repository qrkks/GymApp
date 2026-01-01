import { Skeleton } from "@/components/ui/skeleton";

export default function WorkoutSkeleton() {
  return (
    <div className="flex flex-col gap-4 justify-center items-center w-full">
      {/* Date Header Skeleton */}
      <div className="flex gap-4 justify-center items-center w-full">
        <Skeleton className="w-32 h-8" />
      </div>
      
      {/* Start Workout Button Skeleton */}
      <Skeleton className="w-40 h-10" />
      
      {/* Body Parts Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3 justify-center items-center w-full max-w-2xl">
          {/* Body Part Header */}
          <div className="flex gap-2 items-center">
            <Skeleton className="w-24 h-6" />
            <Skeleton className="w-4 h-4 rounded-full" />
          </div>
          
          {/* Add Exercise Button */}
          <Skeleton className="w-32 h-8" />
          
          {/* Exercise Blocks */}
          {[1, 2].map((j) => (
            <div key={j} className="flex flex-col items-center p-2 w-full">
              {/* Exercise Name */}
              <div className="flex gap-2 items-center mb-2">
                <Skeleton className="w-32 h-5" />
                <Skeleton className="w-4 h-4 rounded-full" />
              </div>
              
              {/* Sets Table */}
              <div className="w-full max-w-md">
                <div className="p-2 rounded-md border">
                  <div className="space-y-2">
                    {[1, 2, 3].map((k) => (
                      <div key={k} className="flex gap-2">
                        <Skeleton className="flex-1 h-8" />
                        <Skeleton className="flex-1 h-8" />
                        <Skeleton className="flex-1 h-8" />
                        <Skeleton className="w-16 h-8" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Add Set Button */}
              <Skeleton className="mt-2 w-20 h-6" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

