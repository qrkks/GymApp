import { Skeleton } from "@/components/ui/skeleton";

export default function WorkoutListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Go to Today Button */}
      <Skeleton className="h-10 w-32" />
      
      {/* Calendar Skeleton */}
      <div className="border rounded-md shadow p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Weekday headers */}
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <Skeleton key={day} className="h-6 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {/* Calendar days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full aspect-square" />
          ))}
        </div>
      </div>
      
      {/* Go to Date Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

