import useSWR from "swr";
import ExerciseSet from "./ExerciseSet";
import authStore from "@/app/store/authStore";
import {useEffect} from "react";

function ExerciseGroup({part, date, addedExercise}) {
  // console.log('in ExerciseGroup', 'date ', date, 'part', part, 'addedExercise', addedExercise);
  const fetcher = (url) =>
    fetch(url, {
      credentials: "include",
      headers: {"X-CSRFToken": authStore.getCookie("csrftoken")},
    }).then((res) => res.json());

  const {
    data: workoutSetData,
    error: workoutSetError,
    mutate: mutateWorkoutSet,
  } = useSWR(
    `http://127.0.0.1:8000/api/workoutset?workout_date=${date}&body_part_name=${part.name}`,
    fetcher
  );

  useEffect(() => {
    if (addedExercise) {
      mutateWorkoutSet();
    }
  }, [addedExercise]);

  if (workoutSetError) return <div>Failed to load data in ExerciseGroup</div>;

  // console.log(workoutSetData);

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

export default ExerciseGroup;
