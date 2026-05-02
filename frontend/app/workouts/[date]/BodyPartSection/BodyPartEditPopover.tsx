import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, FormEvent } from "react";
import config from "@/utils/config";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

interface BodyPartEditPopoverProps {
  set?: unknown;
  part: BodyPart;
  date?: string;
  mutateWorkout: MutateFunction;
}

export default function BodyPartEditPopover({
  part,
  mutateWorkout,
}: BodyPartEditPopoverProps) {
  const { apiUrl } = config;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    setIsPopoverOpen(false);
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bodyPartName = String(formData.get("body_part_name") || "").trim();
    if (!bodyPartName) return;

    fetch(`${apiUrl}/body-part/${part.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ body_part_name: bodyPartName }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        mutateWorkout();
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
          <span className="sr-only">编辑训练部位</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">修改部位名称</h4>
            <p className="text-sm text-muted-foreground">
              部位名称会影响动作库和训练记录中的归类。
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body_part_name">部位名称</Label>
            <Input
              id="body_part_name"
              name="body_part_name"
              defaultValue={part.name}
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
