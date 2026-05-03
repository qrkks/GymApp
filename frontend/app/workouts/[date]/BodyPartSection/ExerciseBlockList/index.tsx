import React, { useEffect, useCallback } from "react";
import useSWR from "swr";
import ExerciseBlock from "./ExerciseBlock";
import config from "@/utils/config";
import type {
  BodyPart,
  ExerciseBlock as ExerciseBlockType,
  MutateFunction,
} from "@/app/types/workout.types";

interface ExerciseBlockListProps {
  part: BodyPart;
  date: string;
  addedExercise: string;
  setMutateRef: (mutate: MutateFunction) => void;
}

function ExerciseBlockList({
  part,
  date,
  addedExercise,
  setMutateRef,
}: ExerciseBlockListProps) {
  const { apiUrl } = config;

  const fetcher = useCallback(async (url: string) => {
    try {
      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await response.json();
      return data as ExerciseBlockType[];
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }, []);

  const {
    data: workoutSetData,
    error: workoutSetError,
    mutate: mutateWorkoutSet,
  } = useSWR<ExerciseBlockType[]>(
    `${apiUrl}/exercise-block?workout_date=${date}&body_part_name=${part.name}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  useEffect(() => {
    if (setMutateRef) {
      setMutateRef(() => mutateWorkoutSet());
    }

    if (addedExercise) {
      mutateWorkoutSet();
    }
  }, [addedExercise, mutateWorkoutSet, setMutateRef]);

  if (workoutSetError) {
    return (
      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
        动作加载失败，请稍后刷新重试。
      </div>
    );
  }

  if (!workoutSetData || workoutSetData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-5 text-sm leading-6 text-muted-foreground">
        还没有添加动作。点击右上角“添加动作”开始记录。
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {workoutSetData.map((exerciseBlock) => (
        <ExerciseBlock
          key={exerciseBlock.id}
          part={part}
          exerciseBlock={exerciseBlock}
          date={date}
          mutateWorkoutSet={mutateWorkoutSet}
        />
      ))}
    </div>
  );
}

export default React.memo(ExerciseBlockList);
