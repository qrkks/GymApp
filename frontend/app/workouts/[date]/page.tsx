"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, PlusCircle, Trash2 } from "lucide-react";
import StartBodyPart from "./BodyPartSection/StartBodyPart";
import BodyPartSection from "./BodyPartSection";
import DateHead from "./DateHead";
import { Button } from "@/components/ui/button";
import WorkoutSkeleton from "@/components/loading/WorkoutSkeleton";
import RefreshIndicator from "@/components/loading/RefreshIndicator";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useLoadingState } from "@/hooks/useLoadingState";
import { showToast } from "@/lib/toast";
import config from "@/utils/config";
import type { BodyPart, ExerciseBlock, MutateFunction } from "@/app/types/workout.types";
import { calculateWorkoutVolume } from "@domain/workout/model/training-volume";
import {
  fetchJsonWithOfflineCache,
  OFFLINE_SYNC_EVENT,
} from "@/lib/offline/workout-store";

interface WorkoutData {
  bodyParts?: BodyPart[];
  date?: string;
  id?: number;
}

interface WorkoutByIdProps {
  params: {
    date: string;
  };
}

function WorkoutById({ params }: WorkoutByIdProps) {
  const { apiUrl } = config;
  const [isWorkoutCreated, setIsWorkoutCreated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);

  const fetcher = async (url: string) => {
    try {
      return await fetchJsonWithOfflineCache<WorkoutData>(url, {
        allowNotFound: true,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "TypeError" &&
        error.message === "Failed to fetch"
      ) {
        console.log("Connection error, will retry later");
        return null;
      }

      throw error;
    }
  };

  const {
    data: workoutData,
    error: workoutError,
    isLoading,
    isValidating,
    mutate: mutateWorkout,
  } = useSWR<WorkoutData | null>(`${apiUrl}/workout/${params.date}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return;
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        return;
      }

      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  const exerciseBlockFetcher = async (url: string) => {
    return (await fetchJsonWithOfflineCache<ExerciseBlock[]>(url)) ?? [];
  };

  const { data: exerciseBlocks, mutate: mutateExerciseBlocks } = useSWR<ExerciseBlock[]>(
    workoutData ? `${apiUrl}/exercise-block?workout_date=${params.date}` : null,
    exerciseBlockFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const { isInitialLoading, isRefreshing, hasError } = useLoadingState(
    workoutData,
    workoutError,
    isLoading,
    isValidating
  );

  const bodyParts = useMemo(() => workoutData?.bodyParts ?? [], [workoutData]);
  const exerciseCount = exerciseBlocks?.length ?? 0;
  const workoutVolume = useMemo(
    () => calculateWorkoutVolume(exerciseBlocks ?? []),
    [exerciseBlocks]
  );
  const formattedWorkoutVolume = useMemo(
    () => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(workoutVolume),
    [workoutVolume]
  );

  useEffect(() => {
    setIsWorkoutCreated(workoutData !== undefined && workoutData !== null);
  }, [workoutData]);

  useEffect(() => {
    if (workoutError) {
      console.error("Workout data fetch error:", workoutError);
    }
  }, [workoutError]);

  useEffect(() => {
    const handleOfflineSync = () => {
      void mutateWorkout();
      void mutateExerciseBlocks();
    };
    window.addEventListener(OFFLINE_SYNC_EVENT, handleOfflineSync);
    return () => window.removeEventListener(OFFLINE_SYNC_EVENT, handleOfflineSync);
  }, [mutateExerciseBlocks, mutateWorkout]);

  function handleCreateWorkout() {
    if (!params?.date || isWorkoutCreated || isCreatingWorkout) {
      return;
    }

    setIsCreatingWorkout(true);

    fetch(`${apiUrl}/workout?createOrGet=true`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date: params.date }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `HTTP error! Status: ${res.status}`);
        }

        showToast.success("创建成功", "已创建今天的训练记录");
        setIsWorkoutCreated(true);
        mutateWorkout();
        mutateExerciseBlocks();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        showToast.error(
          "创建失败",
          error instanceof Error ? error.message : "请稍后重试"
        );
      })
      .finally(() => {
        setIsCreatingWorkout(false);
      });
  }

  function handleDeleteWorkout() {
    if (!params?.date || !isWorkoutCreated) return;

    fetch(`${apiUrl}/workout/${params.date}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP error! Status: ${res.status}`);
        }

        showToast.success("删除成功", "已删除今天的训练记录");
        setIsWorkoutCreated(false);
        mutateWorkout();
        mutateExerciseBlocks();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        showToast.error(
          "删除失败",
          error instanceof Error ? error.message : "请稍后重试"
        );
      });
  }

  const handleMutateWorkout: MutateFunction = async () => {
    try {
      await mutateWorkout();
      await mutateExerciseBlocks();
      console.log("Data revalidation triggered");
    } catch (error) {
      console.error("Failed to update data:", error);
    }
  };

  if (isInitialLoading) {
    return <WorkoutSkeleton />;
  }

  if (hasError && workoutError) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">加载失败</h1>
        <p className="mt-2 text-sm text-muted-foreground">请刷新页面或稍后重试。</p>
        <Button onClick={() => mutateWorkout()} className="mt-6">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {isRefreshing && <RefreshIndicator className="fixed right-4 top-20 z-50" />}

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <DateHead params={params} />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-slate-50/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              训练部位
            </p>
            <p className="mt-2 text-2xl font-semibold">{bodyParts.length}</p>
          </div>
          <div className="rounded-lg border bg-slate-50/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              动作数量
            </p>
            <p className="mt-2 text-2xl font-semibold">{exerciseCount}</p>
          </div>
          <div
            className="rounded-lg border border-primary/20 bg-primary/[0.06] p-4"
            title="各组重量 × 次数之和"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              训练容量
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">
                {formattedWorkoutVolume}
              </span>
              <span className="text-sm font-medium text-muted-foreground">kg</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">重量 × 次数的总和</p>
          </div>
        </div>
      </section>

      {!isWorkoutCreated ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center shadow-sm">
          <PlusCircle className="mx-auto h-11 w-11 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold">这一天还没有训练记录</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            创建记录后可以添加训练部位、动作和组数。适合补录历史训练，也适合从今天开始。
          </p>
          <Button
            onClick={handleCreateWorkout}
            className="mt-6 gap-2"
            disabled={isCreatingWorkout}
          >
            <PlusCircle className="h-4 w-4" />
            {isCreatingWorkout ? "创建中..." : "创建训练记录"}
          </Button>
        </section>
      ) : (
        <div className="grid gap-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">训练内容</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                按部位组织动作，每个动作下记录重量、次数和训练笔记。
              </p>
            </div>
            <StartBodyPart date={params.date} mutateWorkout={handleMutateWorkout} />
          </div>

          {bodyParts.length > 0 ? (
            bodyParts.map((part) => (
              <BodyPartSection
                key={part.id}
                part={part}
                date={params.date}
                mutateWorkout={handleMutateWorkout}
              />
            ))
          ) : (
            <section className="rounded-xl border border-dashed bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold">先添加一个训练部位</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                例如胸、背、腿或肩，然后继续添加今天做的动作。
              </p>
            </section>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              删除今日训练
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="确认删除"
        description="确定要删除今天的训练吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteWorkout}
      />
    </div>
  );
}

export default WorkoutById;
