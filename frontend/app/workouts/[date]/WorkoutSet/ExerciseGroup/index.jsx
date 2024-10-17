import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Check} from "lucide-react";
import useSWR from "swr";
import ExerciseSet from "./ExerciseSet";

function ExerciseGroup({part, date, addedExercise}) {
  // console.log('in ExerciseGroup', 'date ', date, 'part', part, 'addedExercise', addedExercise);
  const fetcher = (url) => fetch(url).then((res) => res.json());

  const {
    data: workoutSetData,
    error: workoutSetError,
    mutate: mutateWorkoutSet,
  } = useSWR(
    `http://127.0.0.1:8000/api/workoutset?workout_date=${date}&excercise_name=${addedExercise}&body_part_name=${part.name}`,
    fetcher
  );

  if (workoutSetError) return <div>Failed to load data</div>;

  // console.log(workoutSetData);

  return (
    <div>
      {workoutSetData?.map((set) => (
        <ExerciseSet key={set.id} part={part} set={set} date={date} mutateWorkoutSet={mutateWorkoutSet} />
      ))}
    </div>
  );
}

export default ExerciseGroup;
