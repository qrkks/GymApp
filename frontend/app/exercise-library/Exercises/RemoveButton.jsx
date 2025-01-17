import {CircleX} from "lucide-react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";

function RemoveButton({exercise, mutate}) {
  const {apiUrl} = config;
  // console.log(item);
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

export default RemoveButton;
