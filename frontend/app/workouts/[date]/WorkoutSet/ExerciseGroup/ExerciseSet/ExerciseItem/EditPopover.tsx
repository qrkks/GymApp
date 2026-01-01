import {Pencil} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useState, FormEvent} from "react";
import authStore from "@/app/store/authStore";
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
    const formDataObj = Object.fromEntries(formData);

    console.log(formDataObj);

    fetch(`${apiUrl}/set/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
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
            {Object.entries(item).map(
              ([key, value]) =>
                key !== "id" &&
                key !== "set_number" && (
                  <div
                    key={key}
                    className="grid items-center grid-cols-3 gap-4"
                  >
                    <Label htmlFor={key}>{key}</Label>
                    <Input
                      name={key}
                      defaultValue={String(value)}
                      className="h-8 col-span-2"
                      type="number"
                      min="0"
                    />
                  </div>
                )
            )}
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

