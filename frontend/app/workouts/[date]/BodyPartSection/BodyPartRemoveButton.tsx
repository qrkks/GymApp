import {CircleX} from "lucide-react";
import {useState} from "react";
import config from "@/utils/config";
import ConfirmDialog from "@/components/ConfirmDialog";
import { showToast } from "@/lib/toast";
import type { BodyPart } from "@/app/types/workout.types";

interface RemoveBodyPartButtonProps {
  part: BodyPart;
  date: string;
  mutateWorkout: (() => void | Promise<void>) | ((...args: any[]) => void | Promise<any>);
}

function RemoveBodyPartButton({part, date, mutateWorkout}: RemoveBodyPartButtonProps) {
  const { apiUrl } = config;
  const [showDialog, setShowDialog] = useState(false);

  function handleConfirm() {
    fetch(`${apiUrl}/workout/${date}/body-parts`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({body_part_names: [part.name]}),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "删除失败");
        }
        showToast.success("删除成功", `已删除训练部位 ${part.name}`);
        mutateWorkout();
      })
      .catch((error) => {
        console.error("Error:", error);
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
        description={`确定要删除训练部位 ${part.name} 吗？此操作将删除该部位下的所有动作和训练数据。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default RemoveBodyPartButton;

