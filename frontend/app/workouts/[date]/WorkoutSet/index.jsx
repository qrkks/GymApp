import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "./AddExerciseButton";
import BodyPartEditPopover from "./BodyPartEditPopover";
import ExerciseGroup from "./ExerciseGroup";
import {useState} from "react";

function WorkoutSet({part, date, mutateWorkout}) {
  const [addedExercise, setAddedExercise] = useState([]);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2">
        <h3>{part.name}</h3>
        <div className="flex items-center gap-1">
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
          <AddExerciseButton
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
            setAddedExercise={setAddedExercise}
          />
        </div>
      </div>
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
