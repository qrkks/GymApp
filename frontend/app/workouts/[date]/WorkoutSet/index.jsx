import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "./AddExerciseButton";
import BodyPartEditPopover from "./BodyPartEditPopover";
import ExerciseGroup from "./ExerciseGroup";
import {useState, useEffect} from "react";

function WorkoutSet({part, date, mutateWorkout}) {
  const [addedExercise, setAddedExercise] = useState("");

  const handleExerciseAdded = async (exercise) => {
    setAddedExercise(exercise);
    try {
      await mutateWorkout();
    } catch (error) {
      console.error('Failed to update workout:', error);
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-center items-center">
      <div className="flex gap-2 items-center">
        <h3>{part.name}</h3>
        <div className="flex gap-1 items-center">
          {/* BodyPartRemoveButton：用于移除训练部位。
        AddExerciseButton：用于添加新的训练动作。
        BodyPartEditPopover：用于编辑训练部位信息。
        ExerciseGroup：显示当前训练部位下的所有训练动作。 */}
          <BodyPartRemoveButton
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
          />
          {/* <BodyPartEditPopover
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
          /> */}
        </div>
      </div>
      <AddExerciseButton
        part={part}
        date={date}
        mutateWorkout={mutateWorkout}
        setAddedExercise={handleExerciseAdded}
      />
      <ExerciseGroup
        part={part}
        date={date}
        addedExercise={addedExercise}
        mutateWorkout={mutateWorkout}
      />
    </div>
  );
}

export default WorkoutSet;
