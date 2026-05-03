"use client";

import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface StartWorkoutProps {
  onStart?: () => void;
}

function StartWorkout({ onStart }: StartWorkoutProps) {
  const router = useRouter();

  const handleClick = () => {
    onStart?.();
    router.push(`/workouts/${getTodayDate()}`);
  };

  return (
    <Button onClick={handleClick} className="gap-2">
      <CalendarCheck className="h-4 w-4" />
      今天训练
    </Button>
  );
}

export default StartWorkout;
