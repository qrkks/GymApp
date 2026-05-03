"use client";

import { AlertTriangle, BookOpen, Dumbbell } from "lucide-react";
import Exercises from "./Exercises";
import useSWR from "swr";
import BodyPartEditPopover from "./../workouts/[date]/BodyPartSection/BodyPartEditPopover";
import RemoveBodyPartButton from "./RemoveButton";
import config from "@/utils/config";
import ExerciseLibrarySkeleton from "@/components/loading/ExerciseLibrarySkeleton";
import RefreshIndicator from "@/components/loading/RefreshIndicator";
import { Button } from "@/components/ui/button";
import { useLoadingState } from "@/hooks/useLoadingState";
import type { BodyPart } from "@/app/types/workout.types";

function Page() {
  const { apiUrl } = config;
  const {
    data: bodyParts,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<BodyPart[]>(`${apiUrl}/body-part`, (url: string) =>
    fetch(url, {
      credentials: "include",
    }).then((res) => res.json())
  );

  const { isInitialLoading, isRefreshing, hasError } = useLoadingState(
    bodyParts,
    error,
    isLoading,
    isValidating
  );

  if (isInitialLoading) {
    return <ExerciseLibrarySkeleton />;
  }

  if (hasError) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">加载失败</h1>
        <p className="mt-2 text-sm text-muted-foreground">请刷新页面重试。</p>
        <Button onClick={() => mutate()} className="mt-6">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {isRefreshing && (
        <RefreshIndicator className="fixed right-4 top-20 z-50" />
      )}

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">动作库</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              管理训练部位和动作
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              将动作按身体部位归档，训练时可以更快选择动作并保持命名统一。
            </p>
          </div>
        </div>
      </section>

      {!bodyParts || bodyParts.length === 0 ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center shadow-sm">
          <Dumbbell className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">暂无训练部位</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            先在训练页添加部位，再回来维护动作库。
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bodyParts.map((part) => (
            <section key={part.id} className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b bg-slate-50/75 p-4">
                <div>
                  <h2 className="text-lg font-semibold">{part.name}</h2>
                  <p className="text-sm text-muted-foreground">训练动作</p>
                </div>
                <div className="flex items-center gap-1">
                  <RemoveBodyPartButton part={part} mutate={() => mutate()} />
                  <BodyPartEditPopover part={part} mutateWorkout={() => mutate()} />
                </div>
              </div>
              <div className="p-4">
                <Exercises part={part} mutate={() => mutate()} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default Page;
