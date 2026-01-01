/**
 * 前端组件使用的类型定义
 */

// BodyPart 类型
export interface BodyPart {
  id: number;
  name: string;
}

// Exercise 类型
export interface Exercise {
  id: number;
  name: string;
  description?: string | null;
  body_part?: BodyPart;
  body_part_id?: number;
}

// Set 类型
export interface Set {
  id: number;
  set_number: number;
  weight: number;
  reps: number;
  exercise_block_id?: number;
}

// ExerciseBlock (WorkoutSet) 类型
export interface ExerciseBlock {
  id: number;
  exercise: Exercise;
  sets: Set[];
}

// Mutate 函数类型
export type MutateFunction = () => void | Promise<void>;

// React 类型
import type { ReactNode } from "react";
export type { ReactNode };

