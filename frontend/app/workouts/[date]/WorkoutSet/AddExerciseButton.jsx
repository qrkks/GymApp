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
import { Button } from "@/components/ui/button";

class Store {
  constructor() {
    makeAutoObservable(this);
  }

  // Observable properties
  previousWorkout = null;
  currentSelectedExercise = null;

  // Actions
  setPreviousWorkout(workout) {
    this.previousWorkout = workout;
  }

  setCurrentExercise(exercise) {
    this.currentSelectedExercise = exercise;
  }
}

export const store = new Store();

function AddExerciseButton({ part, date, setAddedExercise, mutateWorkout }) {
  const { apiUrl } = config;

  // SWR Fetcher
  const fetcher = async (url) => {
    const response = await fetch(url, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response.json();
  };

  const {
    data: exercisesData,
    error: exercisesError,
    mutate: mutateExercises,
  } = useSWR(
    `${apiUrl}/exercise?body_part_name=${part?.name || ""}`,
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
          console.error("Error fetching last workout data:", error);
        });
    }
  }, [store.currentSelectedExercise]);

  useEffect(() => {
    if (exercisesData) {
      mutateExercises();
    }
  }, [date]);

  useEffect(() => {
    console.log('Current exercise changed:', store.currentSelectedExercise);
  }, [store.currentSelectedExercise]);

  useEffect(() => {
    console.log('Exercises data updated:', exercisesData);
  }, [exercisesData]);

  if (exercisesError)
    return (
      <div>
        Failed to load data: {exercisesError.message}
        <button onClick={() => mutateExercises()}>Retry</button>
      </div>
    );

  const handleSubmit = async () => {
    try {
      setAddedExercise(store.currentSelectedExercise);
      
      const response = await fetch(`${apiUrl}/workoutset`, {
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
      });
      
      const data = await response.json();
      await mutateWorkout(); // 等待数据更新完成
      store.setCurrentExercise(""); // 重置选择
      
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to add exercise. Please try again.");
    }
  };

  function handleSelectChange(value) {
    if (value === "new") {
      const newExercise = prompt("Enter the new exercise name:");
      if (!newExercise) return;

      const newDescription = prompt("Enter the new exercise description:");
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
              (currentData) => [...(currentData || []), newExerciseData],
              false
            );
            store.setCurrentExercise(newExercise); // Immediately select the new exercise
          })
          .catch((error) => {
            console.error("Error creating new exercise:", error);
            alert("Failed to create a new exercise. Please try again.");
          });
      }
    } else {
      store.setCurrentExercise(value);
    }
  }

  return (
    <>
      <SheetContainer
        title="Add Exercise"
        description="Add an exercise to your workout"
        triggerButton={
          <Button onClick={() => store.setCurrentExercise("")} variant='secondary'>
            <CirclePlus className="w-4 text-gray-400" /> 
            &nbsp;添加训练动作
          </Button>
        }
        submitButtonText="Confirm"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex flex-col gap-2 items-center space-x-2 w-full">
          <ExerciseSelectInput
            entries={exercisesData || []}
            className="w-2/3"
            placeholder="Select exercise"
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
