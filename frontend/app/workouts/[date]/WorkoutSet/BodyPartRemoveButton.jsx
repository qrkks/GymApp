import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";


function ExersiceSetButtonRemove({part, date, mutateWorkout}) {
  const { apiUrl } = config;
  function handleClick() {
    const isConfirmed = window.confirm(`确定要删除 ${part.name} 吗？`);
    if (!isConfirmed) return;

    fetch(`${apiUrl}/workout/remove-body-parts/${date}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
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

export default ExersiceSetButtonRemove;
