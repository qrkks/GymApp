import {CircleX} from "lucide-react";
import {useState} from "react";
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
    fetch(`${apiUrl}/exercise/${exercise.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(async (res) => {
        // 检查响应内容类型
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          let errorMessage = `HTTP error! Status: ${res.status}`;
          // 只有当响应是 JSON 时才尝试解析
          if (contentType && contentType.includes("application/json")) {
            try {
              const data = await res.json();
              errorMessage = data.error || data.message || errorMessage;
            } catch (e) {
              // 如果 JSON 解析失败，使用默认错误消息
              errorMessage = `服务器错误 (${res.status})`;
            }
          }
          throw new Error(errorMessage);
        }
        // 204 No Content 响应没有 body
        if (res.status === 204) {
          showToast.success("删除成功", `已删除动作 ${exercise.name}`);
          mutate();
          return;
        }
        // 其他成功响应尝试解析 JSON
        if (contentType && contentType.includes("application/json")) {
          try {
            await res.json();
          } catch (e) {
            // JSON 解析失败不影响成功状态
          }
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
