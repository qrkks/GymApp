import { ListChecks } from "lucide-react";
import AddButton from "./AddButton";
import RemoveExerciseBlockButton from "./RemoveButton";
import SetRow from "./SetRow";
import SetTableContainer from "./SetTableContainer";
import type {
  ExerciseBlock,
  BodyPart,
  MutateFunction,
} from "@/app/types/workout.types";
import { calculateExerciseVolume } from "@domain/workout/model/training-volume";

interface ExerciseBlockProps {
  exerciseBlock: ExerciseBlock;
  part: BodyPart;
  date: string;
  mutateWorkoutSet: MutateFunction;
}

function ExerciseBlock({
  exerciseBlock,
  part,
  date,
  mutateWorkoutSet,
}: ExerciseBlockProps) {
  const setCount = exerciseBlock.sets.length;
  const exerciseVolume = calculateExerciseVolume(exerciseBlock);
  const formattedExerciseVolume = new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }).format(exerciseVolume);

  return (
    <article className="rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ListChecks className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{exerciseBlock.exercise.name}</h3>
            <p className="text-xs text-muted-foreground">
              {setCount} 组 · 训练容量 {formattedExerciseVolume} kg
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddButton
            exerciseBlock={exerciseBlock}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
          <RemoveExerciseBlockButton
            exerciseBlock={exerciseBlock}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <SetTableContainer exerciseBlock={exerciseBlock} mutateWorkoutSet={mutateWorkoutSet}>
          {exerciseBlock.sets.map((item) => (
            <SetRow
              exerciseBlock={exerciseBlock}
              key={item.id}
              item={item}
              mutateWorkoutSet={mutateWorkoutSet}
            />
          ))}
        </SetTableContainer>
      </div>
    </article>
  );
}

export default ExerciseBlock;
