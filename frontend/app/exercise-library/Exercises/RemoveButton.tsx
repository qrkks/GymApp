import {CircleX} from "lucide-react";
import {useState} from "react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import ConfirmDialog from "@/components/ConfirmDialog";
import { showToast } from "@/lib/toast";
import type { Exercise, MutateFunction } from "@/app/types/workout.types";

interface RemoveExerciseButtonProps {
  exercise: Exercise;
  mutate: MutateFunction;
}

function RemoveExerciseButton({exercise, mutate}: RemoveExerciseButtonProps) {
  const {apiUrl} = config;
  const [showDialog, setShowDialog] = useState(false);

  function handleConfirm() {
    fetch(`${apiUrl}/exercise/${exercise.id}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookieOrUndefined("csrftoken"),
      },
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP error! Status: ${res.status}`);
        }
        showToast.success("删除成功", `已删除动作 ${exercise.name}`);
        mutate();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        showToast.error("删除失败", error.message || "请稍后重试");
      });
  }

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        <CircleX className="w-4 text-gray-400" />
      </button>
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="确认删除"
        description={`确定要删除动作 ${exercise.name} 吗？`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default RemoveExerciseButton;
