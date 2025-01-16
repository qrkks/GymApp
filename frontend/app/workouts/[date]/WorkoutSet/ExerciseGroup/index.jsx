import useSWR from "swr";
import ExerciseSet from "./ExerciseSet";
import authStore from "@/app/store/authStore";
import {useEffect, useRef} from "react";
import config from "@/utils/config";

function ExerciseGroup({part, date, addedExercise}) {
  const {apiUrl} = config;
  const renderCount = useRef(0);
  
  const fetcher = async (url) => {
    console.log('🔍 Fetcher called with URL:', url);
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: {"X-CSRFToken": authStore.getCookie("csrftoken")},
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Fetched data:', data);
      return data;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  };

  const {
    data: workoutSetData,
    error: workoutSetError,
    mutate: mutateWorkoutSet,
  } = useSWR(
    `${apiUrl}/workoutset?workout_date=${date}&body_part_name=${part.name}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000,
      onSuccess: (data) => {
        console.log('✅ SWR success callback - Data:', data);
      },
      onError: (error) => {
        console.log('❌ SWR error callback:', error);
      }
    }
  );

  useEffect(() => {
    renderCount.current += 1;
    console.log('🔄 ExerciseGroup rendered:', renderCount.current, 'times');
  });

  useEffect(() => {
    console.log('📥 Props received:', {
      part: part?.name,
      date,
      addedExercise
    });
  }, [part, date, addedExercise]);

  useEffect(() => {
    console.log('📊 WorkoutSetData changed:', workoutSetData);
  }, [workoutSetData]);

  useEffect(() => {
    const updateData = async () => {
      if (addedExercise) {
        console.log('🎯 Triggering update for exercise:', addedExercise);
        try {
          console.log('⏳ Starting mutateWorkoutSet');
          await mutateWorkoutSet();
          console.log('✅ mutateWorkoutSet completed');
        } catch (error) {
          console.error('❌ Update failed:', error);
        }
      }
    };

    updateData();
  }, [addedExercise, mutateWorkoutSet]);

  if (workoutSetError) {
    console.error('❌ WorkoutSet error:', workoutSetError);
    return <div>Failed to load data in ExerciseGroup</div>;
  }

  console.log('🎨 Rendering with data:', workoutSetData?.length, 'items');

  return (
    <div>
      {workoutSetData?.map((set) => {
        console.log('📍 Rendering set:', set.id);
        return (
          <ExerciseSet
            key={set.id}
            part={part}
            set={set}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
        );
      })}
    </div>
  );
}

export default ExerciseGroup;
