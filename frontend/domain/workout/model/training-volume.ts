export interface TrainingVolumeSet {
  readonly weight: number;
  readonly reps: number;
}

export interface TrainingVolumeExercise {
  readonly sets: readonly TrainingVolumeSet[];
}

export function calculateSetVolume(set: TrainingVolumeSet): number {
  return set.weight * set.reps;
}

export function calculateExerciseVolume(
  exercise: TrainingVolumeExercise
): number {
  return exercise.sets.reduce(
    (total, set) => total + calculateSetVolume(set),
    0
  );
}

export function calculateWorkoutVolume(
  exercises: readonly TrainingVolumeExercise[]
): number {
  return exercises.reduce(
    (total, exercise) => total + calculateExerciseVolume(exercise),
    0
  );
}
