"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface RefreshIndicatorProps {
  className?: string;
}

/**
 * Small indicator shown when data is refreshing in the background
 */
export default function RefreshIndicator({ className = "" }: RefreshIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      <span>更新中...</span>
    </div>
  );
}

