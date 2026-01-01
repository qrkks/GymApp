import {CircleX} from "lucide-react";
import config from "@/utils/config";
import type { ExerciseBlock, MutateFunction } from "@/app/types/workout.types";
import type { BodyPart } from "@/app/types/workout.types";

interface RemoveExerciseBlockButtonProps {
  date: string;
  mutateWorkoutSet: MutateFunction;
  exerciseBlock: ExerciseBlock;
  part: BodyPart;
}

function RemoveExerciseBlockButton({date, mutateWorkoutSet, exerciseBlock, part}: RemoveExerciseBlockButtonProps) {
  const { apiUrl } = config;
  function handleClick() {
    console.log("remove", exerciseBlock.exercise.name, "date", date);

    const isConfirmed = window.confirm(`确定要删除 ${exerciseBlock.exercise.name} 吗？`);
    if (!isConfirmed) return;

    fetch(`${apiUrl}/exercise-block/${date}/${exerciseBlock.exercise.name}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        mutateWorkoutSet();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }
  return (
    <button onClick={handleClick}>
      <CircleX className="w-4 text-gray-400" />
    </button>
  );
}

export default RemoveExerciseBlockButton;

