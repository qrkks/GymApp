import {CircleX} from "lucide-react";
function ExersiceSetButtonRemove({part, date, mutateWorkout}) {
  function handleClick() {}
  return (
    <button onClick={handleClick}>
      <CircleX className="w-4 text-gray-400" />
    </button>
  );
}

export default ExersiceSetButtonRemove;
