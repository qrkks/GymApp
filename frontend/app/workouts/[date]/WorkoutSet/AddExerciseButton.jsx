import React, { useEffect } from "react";
import { CirclePlus } from "lucide-react";
import { observer } from "mobx-react-lite";
import SheetContainer from "@/components/SheetContainer";
import ExerciseSelectInput from "./ExerciseSelectInput";
import useSWR from "swr";
import authStore from "@/app/store/authStore";
import LastWorkout from "./LastWorkout";
import { makeAutoObservable } from "mobx";
import config from "@/utils/config";

class Store {
  constructor() {
    makeAutoObservable(this);
  }

  // 可观察属性
  previousWorkout = null;
  currentSelectedExercise = null;

  // Action 方法
  setPreviousWorkout(workout) {
    this.previousWorkout = workout;
  }

  setCurrentExercise(exercise) {
    this.currentSelectedExercise = exercise;
  }
}

export const store = new Store();


function AddExerciseButton({ part, date, setAddedExercise, mutateWorkout }) {
  const {apiUrl} = config
  const fetcher = (url) =>
    fetch(url, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
    }).then((res) => res.json());

  const {
    data: exercisesData,
    error: exercisesError,
    mutate: mutateExercises,
  } = useSWR(
    `${apiUrl}/exercise?body_part_name=${part.name}`,
    fetcher
  );

  useEffect(() => {
    if (store.currentSelectedExercise) {
      fetch(
        `${apiUrl}/last-workout-all-sets?exercise_name=${store.currentSelectedExercise}`,
        {
          credentials: "include",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": authStore.getCookie("csrftoken"),
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          store.setPreviousWorkout(data);
        })
        .catch((error) => {
          console.error("获取上次训练数据时出错:", error);
        });
    }
  }, [store.currentSelectedExercise]);

  if (exercisesError) return <div>Failed to load data</div>;

  const handleSubmit = () => {
    console.log("submit", store.currentSelectedExercise);
    console.log("date", date);
    setAddedExercise(store.currentSelectedExercise);

    fetch(`${apiUrl}/workoutset`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
      body: JSON.stringify({
        workout_date: date,
        exercise_name: store.currentSelectedExercise,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        mutateWorkout(); // 重新获取所有训练动作，确保显示完整列表
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
      console.log(newExercise, newDescription);
      if (newExercise) {
        fetch(`${apiUrl}/exercise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": authStore.getCookie("csrftoken"),
          },
          credentials: "include",
          body: JSON.stringify({
            name: newExercise,
            description: newDescription,
            body_part_id: part.id,
          }),
        })
          .then((res) => res.json())
          .then((newExerciseData) => {
            mutateExercises(
              (currentData) => [...currentData, newExerciseData],
              false
            );
            store.setCurrentExercise(newExercise); // 立即选择新创建的动作
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    } else {
      store.setCurrentExercise(value);
    }
  }

  return (
    <>
      <SheetContainer
        title="添加训练动作"
        description="添加训练动作"
        triggerButton={
          <button onClick={() => store.setCurrentExercise("")}>
            <CirclePlus className="w-4 text-gray-400" />
          </button>
        }
        submitButtonText="确定"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex flex-col items-center w-full gap-2 space-x-2">
          <ExerciseSelectInput
            entries={exercisesData || []}
            className="w-2/3"
            placeholder="训练动作"
            name="exercise"
            mutate={mutateExercises}
            selectedExercise={store.currentSelectedExercise}
            onSelectChange={handleSelectChange}
          />
          <LastWorkout
            selectedExercise={store.currentSelectedExercise}
            lastWorkoutData={store.previousWorkout}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default observer(AddExerciseButton);
