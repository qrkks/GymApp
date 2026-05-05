import { CirclePlus } from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import LastWorkout from "../../LastWorkout";
import useSWR from "swr";
import config from "@/utils/config";
import { showToast } from "@/lib/toast";
import type {
  ExerciseBlock,
  BodyPart,
  MutateFunction,
} from "@/app/types/workout.types";
import { clearTrainingNoteAfterSetSubmit } from "../../../set-form-state";

interface AddButtonProps {
  date: string;
  set: ExerciseBlock;
  part: BodyPart;
  mutateWorkoutSet: MutateFunction;
}

function AddButton({ date, set, part, mutateWorkoutSet }: AddButtonProps) {
  const { apiUrl } = config;
  const [formData, setFormData] = useState({
    weight: "",
    reps: "",
    note: "",
  });

  const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => res.json());
  const { data: lastWorkoutData } = useSWR(
    `${apiUrl}/workout/last/sets?exercise_id=${set.exercise.id}`,
    fetcher
  );

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit() {
    console.log("=== 开始提交 ===");
    console.log("原始表单数据:", formData);
    console.log("日期:", date);
    console.log("动作名称:", set.exercise.name);


    const requestBody: {
      workoutDate: string;
      exerciseName: string;
      sets?: Array<{ weight: number; reps: number; note?: string | null }>;
    } = {
      workoutDate: date,
      exerciseName: set.exercise.name,
    };

    // 不在前端做业务校验：只要用户输入了 reps/weight，就按原样提交
    // 具体规则（例如 weight 是否允许为 0、reps 最小值等）由后端值对象/实体统一校验并返回错误
    const sets: Array<{ weight: number; reps: number; note?: string | null }> = [];
    if (formData.weight !== "" || formData.reps !== "") {
      sets.push({
        weight: formData.weight === "" ? 0 : Number(formData.weight),
        reps: formData.reps === "" ? 0 : Number(formData.reps),
        note: formData.note.trim() || null,
      });
    }

    if (sets.length > 0) {
      requestBody.sets = sets;
    }

    const requestBodyString = JSON.stringify(requestBody);
    console.log("完整请求体 (JSON):", requestBodyString);
    console.log("请求体对象:", requestBody);

    const url = `${apiUrl}/exercise-block`;
    console.log("📤 POST URL:", url);
    console.log("📤 POST body object:", requestBody);
    console.log("📤 POST body JSON:", requestBodyString);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: requestBodyString,
    })
      .then(async (res) => {
        const data = await res.json();
        console.log("响应状态:", res.status, "响应数据:", data);

        if (!res.ok) {
          // 处理错误消息，支持多种格式
          let errorMessage = "添加失败";

          if (data.error) {
            // 统一处理错误，无论是字符串还是Zod错误对象
            if (typeof data.error === "string") {
              errorMessage = data.error;
            } else if (Array.isArray(data.error)) {
              // 处理Zod错误数组
              errorMessage = data.error.join("; ");
            } else if (data.error.message) {
              errorMessage = data.error.message;
            } else {
              errorMessage = JSON.stringify(data.error);
            }
          } else if (data.message) {
            errorMessage = data.message;
          }

          console.error("提取的错误消息:", errorMessage);
          throw new Error(errorMessage);
        }
        showToast.success("添加成功", "已添加训练组");
        setFormData(clearTrainingNoteAfterSetSubmit);
        mutateWorkoutSet();
      })
      .catch((error) => {
        console.error("捕获的错误:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        showToast.error("添加失败", errorMsg || "请稍后重试");
      });
  }

  return (
    <>
      <SheetContainer
        title="添加训练组"
        description="添加训练组"
        triggerButton={
          <button>
            <CirclePlus className="w-4 text-gray-400" />
          </button>
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
            selectedExercise={set.exercise.name}
            lastWorkoutData={lastWorkoutData}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default AddButton;
