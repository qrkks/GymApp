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
  bodyPart?: BodyPart;
  bodyPartId?: number;
}

// Set 类型
export interface Set {
  id: number;
  setNumber: number;
  weight: number;
  reps: number;
  exerciseBlockId?: number;
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

