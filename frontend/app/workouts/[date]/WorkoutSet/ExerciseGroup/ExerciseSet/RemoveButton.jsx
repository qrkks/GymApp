import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";

function ExersiceSetButtonRemove({date, mutateWorkoutSet, set}) {
  const { apiUrl } = config;
  function handleClick() {
    console.log("remove", set.exercise.name, "date", date);

    const isConfirmed = window.confirm(`确定要删除 ${set.exercise.name} 吗？`);
    if (!isConfirmed) return;

    fetch(`${apiUrl}/workoutset/${date}/${set.exercise.name}`, {
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

export default ExersiceSetButtonRemove;
