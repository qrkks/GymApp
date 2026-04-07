"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import type { DayContentProps } from "react-day-picker";
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

  const workoutDateSet = new Set((workouts ?? []).map((workout) => workout.date));

  function handleSelect(selectedDate: Date | undefined) {
    setDate(selectedDate);
    if (selectedDate) {
      console.log(formatDateKey(selectedDate));
    }
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
        ? "bg-foreground"
        : "bg-foreground/80";

    return (
      <div className="relative flex h-8 w-8 items-center justify-center">
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
    <div className="flex flex-col gap-4">
      <StartWorkout />
      <Calendar
        className="border rounded-md shadow"
        components={{
          DayContent: WorkoutDayContent,
        }}
        {...({
          mode: "single",
          selected: date,
          onSelect: handleSelect,
        } as const)}
      />
      <Button onClick={handleClick}>
        {date ? `前往 ${date.toLocaleDateString()}` : "没有选择日期"}
      </Button>
    </div>
  );
}

export default Workouts;
