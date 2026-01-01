import {useState, useEffect} from "react";
import authStore from "@/app/store/authStore";
import RemoveExerciseButton from "./RemoveButton";
import useSWR from "swr";
import ExerciseEditPopover from "./EditPopover";
import config from "@/utils/config";
import type { BodyPart, Exercise, MutateFunction } from "@/app/types/workout.types";

interface ExercisesProps {
  part: BodyPart;
  mutate?: MutateFunction;
}

function Exercises({part, mutate}: ExercisesProps) {
  const {apiUrl} = config;

  const {
    data: exercises,
    error,
    mutate: mutateExercises,
  } = useSWR<Exercise[]>(`${apiUrl}/exercise?body_part_name=${part.name}`, (url) =>
    fetch(url, {
      credentials: "include",
      headers: {"X-CSRFToken": authStore.getCookie("csrftoken")},
    }).then((res) => res.json())
  );

  const mutateFn = mutate || mutateExercises;

  if (error) return <div>Failed to load</div>;

  return (
    <ul className="flex flex-col items-center gap-2">
      {Array.isArray(exercises) &&
        exercises.length > 0 &&
        exercises.map((exercise) => (
          <li key={exercise.id} className="flex items-center gap-2">
            <p>{exercise.name}</p>
            <div className="flex items-center gap-1">
              <RemoveExerciseButton exercise={exercise} mutate={mutateFn} />
              <ExerciseEditPopover exercise={exercise} mutate={mutateFn} />
            </div>
          </li>
        ))}
    </ul>
  );
}

export default Exercises;

