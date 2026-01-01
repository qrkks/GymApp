import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import type { BodyPart } from "@/app/types/workout.types";

interface RemoveBodyPartButtonProps {
  part: BodyPart;
  date: string;
  mutateWorkout: () => void | Promise<void>;
}

function RemoveBodyPartButton({part, date, mutateWorkout}: RemoveBodyPartButtonProps) {
  const { apiUrl } = config;
  function handleClick() {
    const isConfirmed = window.confirm(`确定要删除 ${part.name} 吗？`);
    if (!isConfirmed) return;

    fetch(`${apiUrl}/workout/${date}/body-parts`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookieOrUndefined("csrftoken"),
      },
      credentials: "include",
      body: JSON.stringify({body_part_names: [part.name]}),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("api response:", data);
      })
      .then(() => {
        mutateWorkout();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  return (
    <button onClick={handleClick}>
      <CircleX className="w-4 text-gray-400" />
    </button>
  );
}

export default RemoveBodyPartButton;

