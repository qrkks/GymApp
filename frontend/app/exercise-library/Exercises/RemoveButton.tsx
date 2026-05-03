import { Trash2 } from "lucide-react";
import { useState } from "react";
import config from "@/utils/config";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import type { Exercise, MutateFunction } from "@/app/types/workout.types";

interface RemoveExerciseButtonProps {
  exercise: Exercise;
  mutate: MutateFunction;
}

function RemoveExerciseButton({ exercise, mutate }: RemoveExerciseButtonProps) {
  const { apiUrl } = config;
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
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          let errorMessage = `HTTP error! Status: ${res.status}`;
          if (contentType && contentType.includes("application/json")) {
            try {
              const data = await res.json();
              errorMessage = data.error || data.message || errorMessage;
            } catch (e) {
              errorMessage = `服务器错误 (${res.status})`;
            }
          }
          throw new Error(errorMessage);
        }

        if (contentType && contentType.includes("application/json")) {
          try {
            await res.json();
          } catch (e) {
            // Empty JSON response is fine for a successful delete.
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
      <Button variant="ghost" size="icon" onClick={() => setShowDialog(true)}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">删除动作</span>
      </Button>
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
