import AddButton from "./AddButton";
import RemoveButton from "./RemoveButton";
import ExerciseItem from "./ExerciseItem";

function ExerciseSet({set}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {set.exercise.name}
        <div className="flex items-center gap-1">
          <RemoveButton />
          <AddButton />
        </div>
      </div>
      <ExerciseItem />
    </div>
  );
}

export default ExerciseSet;
