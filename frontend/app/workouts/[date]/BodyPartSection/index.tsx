import { Dumbbell } from "lucide-react";
import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "../AddExerciseButton";
import ExerciseBlockList from "./ExerciseBlockList";
import { useState, useRef } from "react";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

interface BodyPartSectionProps {
  part: BodyPart;
  date: string;
  mutateWorkout: MutateFunction;
}

function BodyPartSection({ part, date, mutateWorkout }: BodyPartSectionProps) {
  const [addedExercise, setAddedExercise] = useState("");
  const mutateWorkoutSetRef = useRef<MutateFunction | null>(null);

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-slate-50/75 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{part.name}</h2>
            <p className="text-sm text-muted-foreground">管理这个部位下的训练动作。</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <BodyPartRemoveButton
            part={part}
            date={date}
            mutateWorkout={mutateWorkout}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <ExerciseBlockList
          part={part}
          date={date}
          addedExercise={addedExercise}
          mutateWorkout={mutateWorkout}
          setMutateRef={(mutate) => {
            mutateWorkoutSetRef.current = mutate;
          }}
        />
      </div>
    </section>
  );
}

export default BodyPartSection;
