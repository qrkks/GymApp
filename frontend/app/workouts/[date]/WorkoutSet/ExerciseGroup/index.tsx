import React, { useEffect, useCallback } from 'react';
import useSWR from "swr";
import ExerciseSet from "./ExerciseSet";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import type { BodyPart, ExerciseBlock, MutateFunction } from "@/app/types/workout.types";

interface ExerciseGroupProps {
  part: BodyPart;
  date: string;
  addedExercise: string;
  setMutateRef: (mutate: MutateFunction) => void;
}

function ExerciseGroup({ part, date, addedExercise, setMutateRef }: ExerciseGroupProps) {
  const {apiUrl} = config;

  const fetcher = useCallback(async (url: string) => {
    console.log('🔍 Fetcher called with URL:', url);
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: {"X-CSRFToken": authStore.getCookie("csrftoken")},
      });
      
      const data = await response.json();
      return data as ExerciseBlock[];
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  }, []);

  const {
    data: workoutSetData,
    error: workoutSetError,
    mutate: mutateWorkoutSet,
  } = useSWR<ExerciseBlock[]>(
    `${apiUrl}/exercise-block?workout_date=${date}&body_part_name=${part.name}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  useEffect(() => {
    if (setMutateRef) {
      setMutateRef(mutateWorkoutSet);
    }
    
    if (addedExercise) {
      mutateWorkoutSet();
    }
  }, [addedExercise, mutateWorkoutSet, setMutateRef]);

  if (workoutSetError) return null;

  return (
    <div>
      {workoutSetData?.map((set) => (
        <ExerciseSet
          key={set.id}
          part={part}
          set={set}
          date={date}
          mutateWorkoutSet={mutateWorkoutSet}
        />
      ))}
    </div>
  );
}

export default React.memo(ExerciseGroup);

