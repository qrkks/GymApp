import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import {useState} from "react";
import {Input} from "@/components/ui/input";
import authStore from "@/app/store/authStore";
import LastWorkout from "../../LastWorkout";
import {observer} from "mobx-react-lite";
import useSWR from "swr";

function AddButton({date, set, part, mutateWorkoutSet}) {
  const [formData, setFormData] = useState({
    weight: "",
    reps: "",
  });

  const fetcher = (url) =>
    fetch(url, {credentials: "include"}).then((res) => res.json());
  const {data: lastWorkoutData} = useSWR(
    `http://127.0.0.1:8000/api/last-workout-all-sets?exercise_id=${set.exercise.id}`,
    fetcher
  );

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit() {
    // console.log("formData", formData);
    // console.log({
    //   workout_date: date,
    //   exercise_name: set.exercise.name,
    //   sets: [
    //     {
    //       weight: formData.weight,
    //       reps: formData.reps,
    //     },
    //   ],
    // });
    // console.log(set.exercise.name);
    // console.log(set);

    fetch(`http://127.0.0.1:8000/api/workoutset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
      credentials: "include",
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
          <LastWorkout
            selectedExercise={set.exercise.name}
            lastWorkoutData={lastWorkoutData}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default observer(AddButton);
