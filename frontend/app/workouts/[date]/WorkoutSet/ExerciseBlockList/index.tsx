import React, { useEffect, useCallback } from 'react';
import useSWR from "swr";
import ExerciseBlock from "../ExerciseGroup/ExerciseBlock";
import config from "@/utils/config";
import type { BodyPart, ExerciseBlock as ExerciseBlockType, MutateFunction } from "@/app/types/workout.types";

interface ExerciseBlockListProps {
  part: BodyPart;
  date: string;
  addedExercise: string;
  setMutateRef: (mutate: MutateFunction) => void;
}

function ExerciseBlockList({ part, date, addedExercise, setMutateRef }: ExerciseBlockListProps) {
  const {apiUrl} = config;

  const fetcher = useCallback(async (url: string) => {
    console.log('🔍 Fetcher called with URL:', url);
    try {
      const response = await fetch(url, {
        credentials: "include",
      });
      
      const data = await response.json();
      return data as ExerciseBlockType[];
    } catch (error) {
      console.error('❌ Fetch error:', error);
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

  if (workoutSetError) return null;

  return (
    <div>
      {workoutSetData?.map((exerciseBlock) => (
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

