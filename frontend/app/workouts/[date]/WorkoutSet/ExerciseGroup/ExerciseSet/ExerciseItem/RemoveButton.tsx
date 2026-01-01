import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import type { Set, MutateFunction } from "@/app/types/workout.types";

interface RemoveSetButtonProps {
  item: Set;
  mutateWorkoutSet: MutateFunction;
}

function RemoveSetButton({item, mutateWorkoutSet}: RemoveSetButtonProps) {
  const { apiUrl } = config;
  function handleClick() {
    const isConfirmed = window.confirm(
      `确定要删除第 ${item.set_number} 组吗？`
    );
    if (!isConfirmed) return;

    fetch(`${apiUrl}/set/${item.id}`, {
      method: "DELETE",
      headers: {"Content-Type": "application/json", "X-CSRFToken": authStore.getCookie("csrftoken")},
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
      })
      .then(mutateWorkoutSet)
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

export default RemoveSetButton;

