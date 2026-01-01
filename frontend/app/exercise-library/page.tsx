"use client";
import Exercises from "./Exercises";
import useSWR from "swr";
import BodyPartEditPopover from "./../workouts/[date]/BodyPartSection/BodyPartEditPopover";
import RemoveBodyPartButton from "./RemoveButton";
import config from "@/utils/config";
import ExerciseLibrarySkeleton from "@/components/loading/ExerciseLibrarySkeleton";
import RefreshIndicator from "@/components/loading/RefreshIndicator";
import { useLoadingState } from "@/hooks/useLoadingState";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

function page() {
  const {apiUrl} = config;
  const {
    data: bodyParts,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<BodyPart[]>(`${apiUrl}/body-part`, (url: string) =>
    fetch(url, {
      credentials: "include",
    }).then((res) => res.json())
  );

  const { isInitialLoading, isRefreshing, hasError } = useLoadingState(
    bodyParts,
    error,
    isLoading,
    isValidating
  );

  if (isInitialLoading) {
    return <ExerciseLibrarySkeleton />;
  }

  if (hasError) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center">
        <div className="text-red-600">加载失败，请刷新页面重试</div>
        <button onClick={() => mutate()} className="px-4 py-2 bg-primary text-white rounded">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {isRefreshing && (
        <RefreshIndicator className="fixed top-20 right-4 z-50" />
      )}
      <h2 className="text-center">Exercise Library</h2>
      {!bodyParts || bodyParts.length === 0 ? (
        <div className="text-muted-foreground">暂无训练部位，请先添加训练部位</div>
      ) : (
        bodyParts.map((part) => (
          <div
            key={part.id}
            className="flex flex-col items-center justify-center "
          >
            <div className="flex items-center gap-2">
              <h3>{part.name}</h3>
              <div className="flex items-center gap-1">
                <RemoveBodyPartButton part={part} mutate={() => mutate()} />
                <BodyPartEditPopover part={part} mutateWorkout={() => mutate()} />
              </div>
            </div>
            <Exercises part={part} mutate={() => mutate()} />
          </div>
        ))
      )}
    </div>
  );
}

export default page;

