import BodyPartRemoveButton from "./BodyPartRemoveButton";
import AddExerciseButton from "./AddExerciseButton";
function ExersiceSet({part, date, mutate}) {
  return (
    <div className="flex items-center gap-2">
      <h3>{part.name}</h3>
      <div className="flex items-center gap-1">
        <BodyPartRemoveButton part={part} date={date} mutate={mutate} />
        <AddExerciseButton part={part} date={date} />
      </div>
    </div>
  );
}

export default ExersiceSet;
