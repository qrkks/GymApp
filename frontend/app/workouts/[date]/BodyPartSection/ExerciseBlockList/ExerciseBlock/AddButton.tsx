import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import {useState, ChangeEvent} from "react";
import {Input} from "@/components/ui/input";
import LastWorkout from "../../LastWorkout";
import useSWR from "swr";
import config from "@/utils/config";
import { showToast } from "@/lib/toast";
import type { ExerciseBlock, BodyPart, MutateFunction } from "@/app/types/workout.types";

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
  });

  const fetcher = (url: string) =>
    fetch(url, {credentials: "include"}).then((res) => res.json());
  const {data: lastWorkoutData} = useSWR(
    `${apiUrl}/workout/last/sets?exercise_id=${exerciseBlock.exercise.id}`,
    fetcher
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit() {
    console.log('=== 开始提交 ===');
    console.log('原始表单数据:', formData);
    console.log('日期:', date);
    console.log('动作名称:', exerciseBlock.exercise.name);
    
    // 将字符串转换为数字，空值或无效值转换为 NaN
    const weight = formData.weight ? parseFloat(formData.weight) : NaN;
    const reps = formData.reps ? parseFloat(formData.reps) : NaN;

    console.log('转换后的值 - weight:', weight, '类型:', typeof weight);
    console.log('转换后的值 - reps:', reps, '类型:', typeof reps);

    // 构建请求体，只有当 weight 和 reps 都是有效数字且大于 0 时才包含 sets
    const requestBody: {
      workout_date: string;
      exercise_name: string;
      sets?: Array<{ weight: number; reps: number }>;
    } = {
      workout_date: date,
      exercise_name: exerciseBlock.exercise.name,
    };

    // 只有当 weight 和 reps 都是有效数字且大于 0 时才添加 sets
    // SetEntity 验证要求 weight > 0 且 reps > 0
    if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
      requestBody.sets = [{ weight, reps }];
      console.log('包含 sets 数组');
    } else {
      console.log('不包含 sets 数组（值无效或 <= 0）');
    }

    const requestBodyString = JSON.stringify(requestBody);
    console.log('完整请求体 (JSON):', requestBodyString);
    console.log('请求体对象:', requestBody);

    fetch(`${apiUrl}/exercise-block`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: requestBodyString,
    })
      .then(async (res) => {
        const data = await res.json();
        console.log('=== 前端收到响应 ===');
        console.log('响应状态:', res.status);
        console.log('响应数据 (原始):', data);
        console.log('响应数据 (JSON):', JSON.stringify(data, null, 2));
        console.log('data.error 类型:', typeof data.error);
        console.log('data.error 是否为数组:', Array.isArray(data.error));
        console.log('data.error 值:', data.error);
        
        if (!res.ok) {
          // 处理错误消息，支持多种格式
          let errorMessage = "添加失败";
          
          if (data.error !== undefined && data.error !== null) {
            // 如果是数组（Zod错误对象数组或其他对象数组）
            if (Array.isArray(data.error)) {
              console.log('错误是数组，长度:', data.error.length);
              errorMessage = data.error.map((err: any, index: number) => {
                console.log(`  数组项 ${index}:`, err, '类型:', typeof err);
                if (typeof err === 'string') {
                  return err;
                } else if (err && typeof err === 'object') {
                  // Zod错误对象格式: { path: [], message: string, code: string }
                  const path = err.path && Array.isArray(err.path) ? err.path.join('.') : '';
                  const msg = err.message || err.msg || '';
                  const result = path ? `${path}: ${msg}` : (msg || JSON.stringify(err));
                  console.log(`    解析结果: ${result}`);
                  return result;
                }
                return String(err);
              }).filter(Boolean).join('; ') || '数据验证失败';
            } 
            // 如果是字符串
            else if (typeof data.error === 'string') {
              errorMessage = data.error;
            } 
            // 如果是对象
            else if (typeof data.error === 'object') {
              // 尝试提取常见字段
              errorMessage = data.error.message || 
                            data.error.error || 
                            data.error.msg ||
                            JSON.stringify(data.error);
            } else {
              errorMessage = String(data.error);
            }
          } else if (data.message) {
            errorMessage = data.message;
          }
          
          console.error('最终提取的错误消息:', errorMessage);
          throw new Error(errorMessage);
        }
        showToast.success("添加成功", "已添加训练组");
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

