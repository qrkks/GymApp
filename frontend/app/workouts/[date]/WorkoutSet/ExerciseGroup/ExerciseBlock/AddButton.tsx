import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import {useState, ChangeEvent} from "react";
import {Input} from "@/components/ui/input";
import authStore from "@/app/store/authStore";
import LastWorkout from "../../LastWorkout";
import {observer} from "mobx-react-lite";
import useSWR from "swr";
import config from "@/utils/config";
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
    fetch(`${apiUrl}/exercise-block`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
      credentials: "include",
      body: JSON.stringify({
        workout_date: date,
        exercise_name: exerciseBlock.exercise.name,
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

export default observer(AddButton);

