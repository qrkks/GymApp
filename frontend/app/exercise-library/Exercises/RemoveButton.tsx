import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import type { Exercise, MutateFunction } from "@/app/types/workout.types";

interface RemoveExerciseButtonProps {
  exercise: Exercise;
  mutate: MutateFunction;
}

function RemoveExerciseButton({exercise, mutate}: RemoveExerciseButtonProps) {
  const {apiUrl} = config;
  function handleClick() {
    const isConfirmed = window.confirm(
      `确定要删除 ${exercise.name} 吗？`
    );
    if (!isConfirmed) return;

    fetch(`${apiUrl}/exercise/${exercise.id}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
      })
      .then(() => {
        mutate();
    }).catch((error) => {
      console.error("Fetch error:", error);
    })
  }
  return (
    <button onClick={handleClick}>
      <CircleX className="w-4 text-gray-400" />
    </button>
  );
}

export default RemoveExerciseButton;

