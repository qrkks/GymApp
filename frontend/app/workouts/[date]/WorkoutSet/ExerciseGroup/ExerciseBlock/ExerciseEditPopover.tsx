import {Pencil} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useState, FormEvent} from "react";
import config from "@/utils/config";
import type { ExerciseBlock, BodyPart, MutateFunction } from "@/app/types/workout.types";

interface ExerciseBlockEditPopoverProps {
  exerciseBlock: ExerciseBlock;
  part: BodyPart;
  date: string;
  mutateWorkoutSet: MutateFunction;
}

export default function ExerciseBlockEditPopover({exerciseBlock, part, date, mutateWorkoutSet}: ExerciseBlockEditPopoverProps) {
  const {apiUrl} = config;
  const key = "训练动作";
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    setIsPopoverOpen(false);
    e.preventDefault();
    const form = e.currentTarget;
    const exercise_name = (form[0] as HTMLInputElement).value;
    console.log(exercise_name);
    fetch(`${apiUrl}/exercise/${exerciseBlock.exercise.id}/patch`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({exercise_name: exercise_name}),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        mutateWorkoutSet();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }
  
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button>
          <Pencil className="w-4 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">修改名称</h4>
            <p className="text-sm text-muted-foreground"></p>
          </div>
          <div className="grid gap-2">
            <div key={key} className="grid items-center grid-cols-3 gap-4">
              <Label htmlFor={key}>{key}</Label>
              <Input
                name={key}
                defaultValue={exerciseBlock.exercise.name}
                className="h-8 col-span-2"
                type="text"
                min="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPopoverOpen(false);
              }}
            >
              取消
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

