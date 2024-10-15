"use client";
import SelectInput from "@/components/SelectInput";
import SheetContainer from "@/components/SheetContainer";
import {useState} from "react";
import useSWR from "swr";
import WorkoutSet from "./WorkoutSet";
import {Button} from "@/components/ui/button";

function StartBodyPart({date}) {
  const [selectedValue, setSelectedValue] = useState(null);

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const {
    data: bodyPartsDataForSelect,
    error: bodyPartsError,
    mutate: mutateBodyParts,
  } = useSWR("http://127.0.0.1:8000/api/bodypart", fetcher);

  const {
    data: workoutData,
    error: workoutError,
    mutate: mutateWorkout,
  } = useSWR(`http://127.0.0.1:8000/api/workout/${date}`, fetcher);
  
  if (bodyPartsError || workoutError) return <div>Failed to load data</div>;

  function handleSubmit() {
    console.log("selectedValue", selectedValue);

    if (!selectedValue) {
      console.error("No body part selected");
      return;
    }

    fetch(`http://127.0.0.1:8000/api/workout/add-body-parts/${date}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({body_part_names: [selectedValue]}),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("api response:", data);
      })
      .then(() => {
        mutateWorkout();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <>
      <SheetContainer
        title="选择训练部位"
        description="选择今天的训练部位"
        triggerButton={<Button>添加训练部位</Button>}
        submitButtonText="确定"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex items-center w-full space-x-2">
          <SelectInput
            className="w-2/3"
            placeholder="训练部位"
            name="body_part"
            entries={bodyPartsDataForSelect || []}
            mutate={mutateBodyParts}
            onSelectChange={setSelectedValue}
          />
        </form>
      </SheetContainer>
      <div className="flex flex-col items-center justify-between">
        <pre className="m-auto text-foreground">
          {JSON.stringify(workoutData, null, 2)}
        </pre>
        {workoutData?.body_parts?.map((part) => (
          <WorkoutSet
            key={part.id}
            part={part}
            date={date}
            mutate={mutateWorkout}
          />
        ))}
      </div>
    </>
  );
}

export default StartBodyPart;
