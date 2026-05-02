import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, FormEvent } from "react";
import config from "@/utils/config";
import type { Exercise, MutateFunction } from "@/app/types/workout.types";

interface ExerciseEditPopoverProps {
  exercise: Exercise;
  mutate: MutateFunction;
}

export default function ExerciseEditPopover({
  exercise,
  mutate,
}: ExerciseEditPopoverProps) {
  const { apiUrl } = config;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPopoverOpen(false);

    const formData = new FormData(e.currentTarget);
    const formDataObj = Object.fromEntries(formData);

    fetch(`${apiUrl}/exercise/${exercise.id}/patch`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formDataObj),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        mutate();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">编辑动作名称</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">修改动作名称</h4>
            <p className="text-sm text-muted-foreground">
              统一动作命名，训练记录会更容易复盘。
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exercise_name">动作名称</Label>
            <Input
              id="exercise_name"
              name="exercise_name"
              defaultValue={exercise.name}
              type="text"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
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
