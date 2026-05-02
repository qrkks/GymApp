import {Pencil} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useState, FormEvent} from "react";
import config from "@/utils/config";
import type { Set, MutateFunction } from "@/app/types/workout.types";

interface SetEditPopoverProps {
  item: Set;
  mutateWorkoutSet: MutateFunction;
}

export default function SetEditPopover({item, mutateWorkoutSet}: SetEditPopoverProps) {
  const {apiUrl} = config;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPopoverOpen(false);

    const formData = new FormData(e.currentTarget);
    const weight = Number(formData.get('weight')) || 0;
    const reps = Number(formData.get('reps')) || 0;
    const noteValue = String(formData.get('note') || '').trim();

    const body = { weight, reps, note: noteValue || null };

    fetch(`${apiUrl}/set/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log(data, "in edit popover");
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
            <h4 className="font-medium leading-none">修改训练数据</h4>
            <p className="text-sm text-muted-foreground"></p>
          </div>
          <div className="grid gap-2">
            <div className="grid items-center grid-cols-3 gap-4">
              <Label htmlFor="weight">Weight</Label>
              <Input
                name="weight"
                id="weight"
                defaultValue={String(item.weight)}
                className="h-8 col-span-2"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
              />
            </div>
            <div className="grid items-center grid-cols-3 gap-4">
              <Label htmlFor="reps">Reps</Label>
              <Input
                name="reps"
                id="reps"
                defaultValue={String(item.reps)}
                className="h-8 col-span-2"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">训练笔记</Label>
              <textarea
                name="note"
                id="note"
                defaultValue={item.note ?? ""}
                className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                maxLength={500}
                placeholder="记录疼痛、不适、动作感悟..."
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

