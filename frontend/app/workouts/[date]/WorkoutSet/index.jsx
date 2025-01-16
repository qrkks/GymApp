import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "./AddExerciseButton";
import BodyPartEditPopover from "./BodyPartEditPopover";
import ExerciseGroup from "./ExerciseGroup";
import {useState, useEffect} from "react";

function WorkoutSet({part, date, mutateWorkout}) {
  const [addedExercise, setAddedExercise] = useState("");

  useEffect(() => {
    console.log('Added exercise changed:', addedExercise);
  }, [addedExercise]);

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
