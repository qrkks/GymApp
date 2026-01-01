import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

interface RemoveBodyPartButtonProps {
  part: BodyPart;
  mutate: MutateFunction;
}

function RemoveBodyPartButton({ part, mutate}: RemoveBodyPartButtonProps) {
  const { apiUrl } = config;
  function handleClick() {
    const isConfirmed = window.confirm(
      `确定要删除 ${part.name} 吗？`
    );
    if (!isConfirmed) return;

    fetch(`${apiUrl}/body-part/${part.id}`, {
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

export default RemoveBodyPartButton;

