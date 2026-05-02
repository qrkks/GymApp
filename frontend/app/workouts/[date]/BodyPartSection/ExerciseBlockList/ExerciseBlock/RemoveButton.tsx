import { Trash2 } from "lucide-react";
import { useState } from "react";
import config from "@/utils/config";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import type { ExerciseBlock, MutateFunction } from "@/app/types/workout.types";
import type { BodyPart } from "@/app/types/workout.types";

interface RemoveExerciseBlockButtonProps {
  date: string;
  mutateWorkoutSet: MutateFunction;
  exerciseBlock: ExerciseBlock;
  part: BodyPart;
}

function RemoveExerciseBlockButton({
  date,
  mutateWorkoutSet,
  exerciseBlock,
  part,
}: RemoveExerciseBlockButtonProps) {
  const { apiUrl } = config;
  const [showDialog, setShowDialog] = useState(false);

  function handleConfirm() {
    fetch(`${apiUrl}/exercise-block/${date}/${encodeURIComponent(exerciseBlock.exercise.name)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP error! Status: ${res.status}`);
        }
        showToast.success("删除成功", `已删除动作 ${exerciseBlock.exercise.name}`);
        mutateWorkoutSet();
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
        description={`确定要删除动作 ${exerciseBlock.exercise.name} 吗？此操作会删除该动作的所有训练组数据。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default RemoveExerciseBlockButton;
