import AddButton from "./AddButton";
import RemoveButton from "./RemoveButton";
import ExerciseItem from "./ExerciseItem";
import useSWR from "swr";

function ExerciseSet({set, part, date, mutateWorkoutSet}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {set.exercise.name}
        <div className="flex items-center gap-1">
          <RemoveButton
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
          <AddButton
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
        </div>
      </div>
      {/* <pre>{JSON.stringify(set.sets, null, 2)}</pre> */}
      {set.sets.map((item) => (
        <ExerciseItem
          set={set}
          key={item.id}
          item={item}
          mutateWorkoutSet={mutateWorkoutSet}
        />
      ))}
    </div>
  );
}

export default ExerciseSet;
