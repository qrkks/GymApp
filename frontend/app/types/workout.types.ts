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
// 兼容 SWR 的 mutate 函数，它可能返回 Promise<void | T | undefined>
export type MutateFunction = (() => void | Promise<void | unknown>) | ((...args: any[]) => void | Promise<void | unknown>);

// React 类型
import type { ReactNode } from "react";
export type { ReactNode };

