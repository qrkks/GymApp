import RemoveButton from "./RemoveButton";

function index({item, mutateWorkoutSet}) {
  return (
    <div className="flex items-center gap-2">
      {JSON.stringify(item)}
      <RemoveButton item={item}  mutateWorkoutSet={mutateWorkoutSet}/>
    </div>
  );
}

export default index;
