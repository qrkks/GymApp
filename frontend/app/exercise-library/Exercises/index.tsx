import RemoveExerciseButton from "./RemoveButton";
import useSWR from "swr";
import ExerciseEditPopover from "./EditPopover";
import config from "@/utils/config";
import type {
  BodyPart,
  Exercise,
  MutateFunction,
} from "@/app/types/workout.types";

interface ExercisesProps {
  part: BodyPart;
  mutate?: MutateFunction;
}

function Exercises({ part, mutate }: ExercisesProps) {
  const { apiUrl } = config;

  const {
    data: exercises,
    error,
    mutate: mutateExercises,
  } = useSWR<Exercise[]>(`${apiUrl}/exercise?body_part_name=${part.name}`, (url: string) =>
    fetch(url, {
      credentials: "include",
    }).then((res) => res.json())
  );

  const mutateFn: MutateFunction = mutate || (() => mutateExercises());

  if (error) {
    return <div className="text-sm text-destructive">动作加载失败</div>;
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        这个部位还没有动作。
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {exercises.map((exercise) => (
        <li
          key={exercise.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5"
        >
          <div>
            <p className="font-medium">{exercise.name}</p>
            {exercise.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {exercise.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <ExerciseEditPopover exercise={exercise} mutate={mutateFn} />
            <RemoveExerciseButton exercise={exercise} mutate={mutateFn} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Exercises;
