import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "./AddExerciseButton";
import ExerciseBlockList from "./ExerciseBlockList";
import {useState, useRef} from "react";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

interface BodyPartSectionProps {
  part: BodyPart;
  date: string;
  mutateWorkout: MutateFunction;
}

function BodyPartSection({part, date, mutateWorkout}: BodyPartSectionProps) {
  const [addedExercise, setAddedExercise] = useState("");
  const mutateWorkoutSetRef = useRef<MutateFunction | null>(null);

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
          if (mutateWorkoutSetRef.current) {
            await mutateWorkoutSetRef.current();
          }
        }}
        setAddedExercise={setAddedExercise}
      />
      <ExerciseBlockList
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

export default BodyPartSection;

