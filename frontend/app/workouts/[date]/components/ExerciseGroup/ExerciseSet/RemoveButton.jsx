import {CircleX} from "lucide-react";
function ExersiceSetButtonRemove({part, date, mutateWorkout}) {
  function handleClick() {
    const isConfirmed = window.confirm(`确定要删除 ${part.name} 吗？`);
    if (!isConfirmed) return;

    fetch(`http://127.0.0.1:8000/api/workout/${date}/${exercise_name}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        mutateWorkout();
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
