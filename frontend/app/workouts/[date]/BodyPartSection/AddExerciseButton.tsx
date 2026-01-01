import React, {useEffect, useRef} from "react";
import {CirclePlus} from "lucide-react";
import {observer} from "mobx-react-lite";
import SheetContainer from "@/components/SheetContainer";
import ExerciseSelectInput from "./ExerciseSelectInput";
import useSWR from "swr";
import authStore from "@/app/store/authStore";
import LastWorkout from "./LastWorkout";
import {makeAutoObservable} from "mobx";
import config from "@/utils/config";
import {Button} from "@/components/ui/button";
import type { BodyPart, Exercise, MutateFunction } from "@/app/types/workout.types";
import type { LastWorkoutData } from "./LastWorkout";

class Store {
  previousWorkout: LastWorkoutData | null = null;
  currentSelectedExercise: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setPreviousWorkout(workout: LastWorkoutData | null) {
    this.previousWorkout = workout;
  }

  setCurrentExercise(exercise: string | null) {
    this.currentSelectedExercise = exercise;
  }
}

export const store = new Store();

interface AddExerciseButtonProps {
  part: BodyPart;
  date: string;
  setAddedExercise: (exercise: string) => void;
  mutateWorkout: MutateFunction;
}

function AddExerciseButton({part, date, setAddedExercise, mutateWorkout}: AddExerciseButtonProps) {
  const {apiUrl} = config;
  const submitCount = useRef(0);

  const fetcher = async (url: string) => {
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

    return response.json() as Promise<Exercise[]>;
  };

  const {
    data: exercisesData,
    error: exercisesError,
    mutate: mutateExercises,
  } = useSWR<Exercise[]>(`${apiUrl}/exercise?body_part_name=${part?.name || ""}`, fetcher);

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
          store.setPreviousWorkout(data as LastWorkoutData);
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

  if (exercisesError)
    return (
      <div>
        Failed to load data: {exercisesError.message}
        <button onClick={() => mutateExercises()}>Retry</button>
      </div>
    );

  const handleSubmit = async () => {
    try {
      if (!store.currentSelectedExercise) return;
      
      setAddedExercise(store.currentSelectedExercise);

      const response = await fetch(`${apiUrl}/exercise-block`, {
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

      await mutateWorkout();

      store.setCurrentExercise("");
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  function handleSelectChange(value: string) {
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
              (currentData) => [...(currentData || []), newExerciseData as Exercise],
              false
            );
            store.setCurrentExercise(newExercise);
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
          <Button
            onClick={() => store.setCurrentExercise("")}
            variant="secondary"
          >
            <CirclePlus className="w-4 text-gray-400" />
            &nbsp;添加训练动作
          </Button>
        }
        submitButtonText="Confirm"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex flex-col items-center w-full gap-2 space-x-2">
          <ExerciseSelectInput
            entries={exercisesData || []}
            className="w-2/3"
            placeholder="Select exercise"
            name="exercise"
            mutate={mutateExercises}
            selectedExercise={store.currentSelectedExercise || undefined}
            onSelectChange={handleSelectChange}
          />
          <LastWorkout
            selectedExercise={store.currentSelectedExercise || ""}
            lastWorkoutData={store.previousWorkout}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default observer(AddExerciseButton);

