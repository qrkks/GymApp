import AddButton from "./AddButton";
import RemoveButton from "./RemoveButton";
import ExerciseItem from "./ExerciseItem";
import SetTableContainer from "./SetTableContainer";
import BodyPartEditPopover from "./ExerciseEditPopover";

function ExerciseSet({set, part, date, mutateWorkoutSet}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <h4>{set.exercise.name}</h4>
        <div className="flex items-center gap-1">
          <RemoveButton
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
          {/* <BodyPartEditPopover
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          /> */}
          <AddButton
            set={set}
            part={part}
            date={date}
            mutateWorkoutSet={mutateWorkoutSet}
          />
        </div>
      </div>
      {/* <pre>{JSON.stringify(set.sets, null, 2)}</pre> */}
      <SetTableContainer set={set} mutateWorkoutSet={mutateWorkoutSet}>
        {set.sets.map((item) => (
          <>
          {/* <pre>{JSON.stringify(item.id, null, 2)}</pre> */}
          <ExerciseItem
            set={set}
            key={item.id}
            item={item}
            mutateWorkoutSet={mutateWorkoutSet}
            />
            </>
        ))}
      </SetTableContainer>
    </div>
  );
}

export default ExerciseSet;
