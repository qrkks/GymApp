import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import useSWR from "swr";
import ExerciseSelectInput from "./ExerciseSelectInput";
import {useEffect, useState} from "react";

function AddExerciseButton({part, date, setAddedExercise}) {
  const [selectedExercise, setSelectedExercise] = useState("");

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const {
    data: excercisesData,
    error: excercisesError,
    mutate: mutateExcercises,
  } = useSWR(`http://127.0.0.1:8000/api/exercise`, fetcher);



  if (excercisesError) return <div>Failed to load data</div>;

  const handleSubmit = () => {
    console.log("submit", selectedExercise);
    setAddedExercise(selectedExercise);
    fetch(`http://127.0.0.1:8000/api/workoutset`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        workout_date: date,
        exercise_name: selectedExercise,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  function handleSelectChange(value) {
    if (value === "new") {
      const newExercise = prompt("请输入新的训练动作");
      if (!newExercise) return;
      const newDescription = prompt("请输入新的训练动作描述");
      if (newExercise) {
        fetch("http://127.0.0.1:8000/api/exercise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newExercise,
            description: newDescription,
            body_part_id: part.id,
          }),
        })
          .then((res) => res.json())
          .then(() => {
            mutateExcercises();
            setSelectedExercise(newExercise); // 立即选择新创建的动作
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    } else {
      setSelectedExercise(value);
    }
  }

  return (
    <>
      <SheetContainer
        title="添加训练动作"
        description="添加训练动作"
        triggerButton={
          <button onClick={() => setSelectedExercise("")}>
            <CirclePlus className="w-4 text-gray-400" />
          </button>
        }
        submitButtonText="确定"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex items-center w-full space-x-2">
          <ExerciseSelectInput
            entries={excercisesData || []}
            className="w-2/3"
            placeholder="训练动作"
            name="exercise"
            mutate={mutateExcercises}
            selectedExercise={selectedExercise}
            onSelectChange={handleSelectChange}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default AddExerciseButton;
