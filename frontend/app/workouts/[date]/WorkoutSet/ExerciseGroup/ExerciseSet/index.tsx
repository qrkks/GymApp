import AddButton from "./AddButton";
import RemoveExerciseBlockButton from "./RemoveButton";
import ExerciseItem from "./ExerciseItem";
import SetTableContainer from "./SetTableContainer";
import ExerciseBlockEditPopover from "./ExerciseEditPopover";
import type { ExerciseBlock, BodyPart, MutateFunction } from "@/app/types/workout.types";

interface ExerciseSetProps {
  set: ExerciseBlock;
  part: BodyPart;
  date: string;
  mutateWorkoutSet: MutateFunction;
}

function ExerciseSet({set, part, date, mutateWorkoutSet}: ExerciseSetProps) {
  return (
    <div className="flex flex-col items-center p-2">
      <div className="flex items-center gap-2">
        <h4>{set.exercise.name}</h4>
        <div className="flex items-center gap-1">
          <RemoveExerciseBlockButton
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
          {/* <ExerciseBlockEditPopover
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          /> */}
        </div>
      </div>
      <SetTableContainer set={set} mutateWorkoutSet={mutateWorkoutSet}>
        {set.sets.map((item) => (
          <ExerciseItem
            set={set}
            key={item.id}
            item={item}
            mutateWorkoutSet={mutateWorkoutSet}
          />
        ))}
      </SetTableContainer>
      <AddButton
        set={set}
        part={part}
        date={date}
        mutateWorkoutSet={mutateWorkoutSet}
      />
    </div>
  );
}

export default ExerciseSet;

