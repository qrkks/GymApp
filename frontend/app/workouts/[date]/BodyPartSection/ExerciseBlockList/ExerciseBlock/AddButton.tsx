import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import {useState, ChangeEvent} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import LastWorkout, { type LastWorkoutData } from "../../LastWorkout";
import useSWR from "swr";
import config from "@/utils/config";
import { showToast } from "@/lib/toast";
import type { ExerciseBlock, BodyPart, MutateFunction } from "@/app/types/workout.types";
import { clearTrainingNoteAfterSetSubmit } from "../../../set-form-state";
import {
  fetchJsonWithOfflineCache,
  OfflineHttpError,
  submitSetWithOfflineQueue,
} from "@/lib/offline/workout-store";

interface AddButtonProps {
  date: string;
  exerciseBlock: ExerciseBlock;
  part: BodyPart;
  mutateWorkoutSet: MutateFunction;
}

function AddButton({date, exerciseBlock, part, mutateWorkoutSet}: AddButtonProps) {
  const {apiUrl} = config;
  const [formData, setFormData] = useState({
    weight: "",
    reps: "",
    note: "",
  });

  const fetcher = (url: string) =>
    fetchJsonWithOfflineCache<LastWorkoutData>(url);
  const {data: lastWorkoutData} = useSWR(
    `${apiUrl}/workout/last/sets?exercise_id=${exerciseBlock.exercise.id}`,
    fetcher
  );

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit() {
    // 前端只做基础格式验证：检查是否是有效数字
    // 业务规则验证（weight >= 0, reps > 0）由后端 Entity 负责
    const weight = formData.weight ? parseFloat(formData.weight) : NaN;
    const reps = formData.reps ? parseFloat(formData.reps) : NaN;

    if (Number.isNaN(weight) || Number.isNaN(reps)) {
      showToast.error("添加失败", "请填写有效的重量和次数");
      return;
    }

    try {
      const result = await submitSetWithOfflineQueue({
        url: `${apiUrl}/exercise-block`,
        workoutDate: date,
        exerciseName: exerciseBlock.exercise.name,
        weight,
        reps,
        note: formData.note.trim() || null,
      });

      setFormData(clearTrainingNoteAfterSetSubmit);
      await mutateWorkoutSet();
      if (result.status === "queued") {
        showToast.success("已离线保存", "联网后会自动同步这组训练");
      } else {
        showToast.success("添加成功", "已添加训练组");
      }
    } catch (error) {
      console.error("添加训练组失败:", error);
      const errorMessage =
        error instanceof OfflineHttpError || error instanceof Error
          ? error.message
          : "请稍后重试";
      showToast.error("添加失败", errorMessage || "请稍后重试");
    }
  }

  return (
    <>
      <SheetContainer
        title="添加训练组"
        description="填写本组的重量、次数和训练笔记。"
        triggerButton={
          <Button variant="secondary" size="sm" className="gap-1.5">
            <CirclePlus className="h-4 w-4" />
            添加组
          </Button>
        }
        submitButtonText="确定"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex flex-col gap-2 justify-center items-center w-full">
          <Input
            name="weight"
            type="number"
            min="0"
            placeholder="Weight"
            value={formData.weight || ""}
            onChange={handleChange}
          />
          <Input
            name="reps"
            type="number"
            min="0"
            placeholder="Reps"
            value={formData.reps || ""}
            onChange={handleChange}
          />
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            maxLength={500}
            placeholder="记录疼痛、不适、动作感悟..."
          />
          <LastWorkout
            selectedExercise={exerciseBlock.exercise.name}
            lastWorkoutData={lastWorkoutData}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default AddButton;

