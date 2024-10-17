import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import useSWR from "swr";
import {use, useEffect, useState} from "react";
import {Input} from "@/components/ui/input";

function AddButton({date, set, part,  mutateWorkoutSet}) {
  const [formData, setFormData] = useState({
    weight: "",
    reps: "",
  });

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit() {
    console.log("formData", formData);
    console.log({
      workout_date: date,
      exercise_name: set.exercise.name,
      sets: [
        {
          weight: formData.weight,
          reps: formData.reps,
        },
      ],
    });

    fetch(`http://127.0.0.1:8000/api/workoutset`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        workout_date: date,
        exercise_name: set.exercise.name,
        sets: [
          {
            weight: formData.weight,
            reps: formData.reps,
          },
        ],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // console.log(data);
        mutateWorkoutSet();
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
        <form className="flex flex-col items-center justify-center w-full gap-2">
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
        </form>
      </SheetContainer>
    </>
  );
}

export default AddButton;
