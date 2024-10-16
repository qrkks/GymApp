import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Check} from "lucide-react";

function ExerciseGroup({part, date, addedExercise}) {
  return (
    <div>
      <p>{date}</p>
      <p>{addedExercise}</p>
      <div>{JSON.stringify(part)}</div>
      <div>动作</div>
      <div className="flex items-center gap-2">
        <Input placeholder="weight" className="w-32" />
        <Input placeholder="reps" className="w-32" />
        <Check className="w-5 text-gray-400" />
      </div>
      <Button>新增</Button>
    </div>
  );
}

export default ExerciseGroup;
