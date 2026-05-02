"use client";

import { Plus } from "lucide-react";
import SelectInput from "@/components/SelectInput";
import SheetContainer from "@/components/SheetContainer";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import config from "@/utils/config";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

interface StartBodyPartProps {
  date: string;
  mutateWorkout: MutateFunction;
}

function StartBodyPart({ date, mutateWorkout }: StartBodyPartProps) {
  const { apiUrl } = config;
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => res.json());
  const {
    data: bodyPartsDataForSelect,
    error: bodyPartsError,
    mutate: mutateBodyParts,
  } = useSWR<BodyPart[]>(`${apiUrl}/body-part`, fetcher);

  if (bodyPartsError) {
    return <div className="text-sm text-destructive">训练部位加载失败</div>;
  }

  function handleSubmit() {
    if (!selectedValue) {
      console.error("No body part selected");
      return;
    }

    fetch(`${apiUrl}/workout/${date}/body-parts`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bodyPartNames: [selectedValue] }),
    })
      .then((response) => response.json())
      .then(() => {
        mutateWorkout();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <SheetContainer
      title="选择训练部位"
      description="为这一天添加一个训练部位。"
      triggerButton={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          添加部位
        </Button>
      }
      submitButtonText="确定"
      onHandleSubmit={handleSubmit}
    >
      <form className="flex w-full items-center">
        <SelectInput
          className="w-full"
          placeholder="训练部位"
          name="body_part"
          entries={bodyPartsDataForSelect || []}
          mutate={mutateBodyParts}
          onSelectChange={setSelectedValue}
        />
      </form>
    </SheetContainer>
  );
}

export default StartBodyPart;
