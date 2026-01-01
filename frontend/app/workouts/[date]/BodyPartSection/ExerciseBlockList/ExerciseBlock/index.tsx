import AddButton from "./AddButton";
import RemoveExerciseBlockButton from "./RemoveButton";
import SetRow from "./SetRow";
import SetTableContainer from "./SetTableContainer";
import ExerciseBlockEditPopover from "./ExerciseEditPopover";
import type { ExerciseBlock, BodyPart, MutateFunction } from "@/app/types/workout.types";

interface ExerciseBlockProps {
  exerciseBlock: ExerciseBlock;
  part: BodyPart;
  date: string;
  mutateWorkoutSet: MutateFunction;
}

function ExerciseBlock({exerciseBlock, part, date, mutateWorkoutSet}: ExerciseBlockProps) {
  return (
    <div className="flex flex-col items-center p-2">
      <div className="flex items-center gap-2">
        <h4>{exerciseBlock.exercise.name}</h4>
        <div className="flex items-center gap-1">
          <RemoveExerciseBlockButton
            exerciseBlock={exerciseBlock}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
          {/* <ExerciseBlockEditPopover
            exerciseBlock={exerciseBlock}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          /> */}
        </div>
      </div>
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
      <AddButton
        exerciseBlock={exerciseBlock}
        part={part}
        date={date}
        mutateWorkoutSet={mutateWorkoutSet}
      />
    </div>
  );
}

export default ExerciseBlock;

