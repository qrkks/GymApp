import { Skeleton } from "@/components/ui/skeleton";

export default function ExerciseLibrarySkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {/* Title */}
      <Skeleton className="h-8 w-48" />
      
      {/* Body Parts */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center w-full max-w-2xl"
        >
          {/* Body Part Header */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          
          {/* Exercises */}
          <div className="w-full space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-2 p-2 border rounded">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-4 rounded-full ml-auto" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

