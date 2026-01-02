import React from "react";
import type { Set } from "@/app/types/workout.types";

export interface LastWorkoutData {
  date: string;
  sets: Set[];
}

interface LastWorkoutProps {
  selectedExercise: string;
  lastWorkoutData?: LastWorkoutData | null;
}

function LastWorkout({ selectedExercise, lastWorkoutData }: LastWorkoutProps) {
  let daysAgo: number | null = null;

  if (lastWorkoutData?.date) {
    const workoutDate = new Date(lastWorkoutData.date);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    workoutDate.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - workoutDate.getTime();
    daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  const sets = lastWorkoutData?.sets || [];

  return (
    <>
      {selectedExercise && sets.length > 0 ? (
        <div className="w-full">
          <h4>
            上次 {selectedExercise} 训练数据 ({lastWorkoutData?.date}，{daysAgo} 天前):
          </h4>
          <ul>
            {sets.map((set, index) => (
              <li key={index}>
                组 {set.setNumber} - 重量: {set.weight}, 次数: {set.reps}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        selectedExercise && <p>没有上次训练数据</p>
      )}
    </>
  );
}

export default LastWorkout;

