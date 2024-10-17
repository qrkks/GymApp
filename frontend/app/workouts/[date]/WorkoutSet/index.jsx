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
          <BodyPartRemoveButton
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
          />
          <BodyPartEditPopover
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
          />
          <AddExerciseButton
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
            setAddedExercise={setAddedExercise}
          />
        </div>
      </div>
      <ExerciseGroup part={part} date={date} addedExercise={addedExercise} />
    </div>
  );
}

export default WorkoutSet;
