import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "./AddExerciseButton";
import ExerciseGroup from "./ExerciseGroup";
import {useState, useRef} from "react";

function WorkoutSet({part, date, mutateWorkout}) {
  const [addedExercise, setAddedExercise] = useState("");
  // 使用 useRef 存储 mutateWorkoutSet 函数
  const mutateWorkoutSetRef = useRef(null);

  return (
    <div className="flex flex-col gap-3 justify-center items-center">
      <div className="flex gap-2 items-center">
        <h3>{part.name}</h3>
        <div className="flex gap-1 items-center">
          <BodyPartRemoveButton
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
          />
        </div>
      </div>
      <AddExerciseButton
        part={part}
        date={date}
        mutateWorkout={async () => {
          await mutateWorkout();
          // 如果 mutateWorkoutSet 存在，则调用它
          if (mutateWorkoutSetRef.current) {
            await mutateWorkoutSetRef.current();
          }
        }}
        setAddedExercise={setAddedExercise}
      />
      <ExerciseGroup
        part={part}
        date={date}
        addedExercise={addedExercise}
        setMutateRef={(mutate) => {
          mutateWorkoutSetRef.current = mutate;
        }}
      />
    </div>
  );
}

export default WorkoutSet;
