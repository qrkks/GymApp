"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { DayContentProps } from "react-day-picker";
import { CalendarDays, ChevronRight, Dumbbell, History } from "lucide-react";
import StartWorkout from "./GoToTodayButton";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import WorkoutListSkeleton from "@/components/loading/WorkoutListSkeleton";
import config from "@/utils/config";

interface WorkoutSummary {
  id: number;
  date: string;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function Workouts() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { apiUrl } = config;

  const workoutsFetcher = async (url: string) => {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workouts: ${response.status}`);
    }

    return response.json() as Promise<WorkoutSummary[]>;
  };

  const { data: workouts } = useSWR<WorkoutSummary[]>(
    `${apiUrl}/workout`,
    workoutsFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    setDate(new Date());
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const workoutDateSet = useMemo(
    () => new Set((workouts ?? []).map((workout) => workout.date)),
    [workouts]
  );

  const recentWorkouts = useMemo(
    () => [...(workouts ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [workouts]
  );

  function handleSelect(selectedDate: Date | undefined) {
    setDate(selectedDate);
  }

  function handleClick() {
    if (!date) return;
    router.push(`/workouts/${formatDateKey(date)}`);
  }

  function WorkoutDayContent({ date, activeModifiers }: DayContentProps) {
    const hasWorkout = workoutDateSet.has(formatDateKey(date));
    const dotClassName = activeModifiers.selected
      ? "bg-primary-foreground/90"
      : activeModifiers.today
        ? "bg-primary"
        : "bg-primary/80";

    return (
      <div className="relative flex h-9 w-9 items-center justify-center">
        <span>{date.getDate()}</span>
        {hasWorkout ? (
          <span
            className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${dotClassName}`}
            aria-hidden="true"
          />
        ) : null}
      </div>
    );
  }

  if (isLoading) {
    return <WorkoutListSkeleton />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)]">
      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CalendarDays className="h-4 w-4" />
              训练日历
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">选择训练日期</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              有训练记录的日期会显示标记，进入日期后可以继续补充动作和组数。
            </p>
          </div>
          <StartWorkout />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[auto_1fr]">
          <Calendar
            className="rounded-xl border bg-white p-4 shadow-none"
            classNames={{
              month: "space-y-5",
              caption_label: "text-base font-semibold",
              head_cell: "w-10 text-xs font-medium text-muted-foreground",
              row: "mt-2 flex w-full",
              day: "h-10 w-10 rounded-lg p-0 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
            }}
            components={{
              DayContent: WorkoutDayContent,
            }}
            {...({
              mode: "single",
              selected: date,
              onSelect: handleSelect,
            } as const)}
          />

          <div className="rounded-xl border bg-slate-50/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">当前选择</p>
                <h2 className="text-xl font-semibold">
                  {date ? formatDisplayDate(date) : "尚未选择日期"}
                </h2>
              </div>
            </div>
            <Button onClick={handleClick} disabled={!date} className="mt-6 w-full gap-2">
              进入训练记录
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <aside className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <History className="h-4 w-4" />
              最近训练
            </div>
            <h2 className="mt-2 text-xl font-semibold">训练记录</h2>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {workouts?.length ?? 0} 天
          </span>
        </div>

        <div className="mt-5 grid gap-2">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => router.push(`/workouts/${workout.date}`)}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="font-medium">{workout.date}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-5 text-sm leading-6 text-muted-foreground">
              还没有训练记录。选择今天开始记录第一组训练。
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default Workouts;
