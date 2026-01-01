"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";

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

function StartWorkout({onStart}: StartWorkoutProps) {
  const [resData, setResData] = useState<{date?: string}>({});
  const router = useRouter();

  const handleClick = () => {
    router.push(`/workouts/${getTodayDate()}`);
  };
  
  return (
    <>
      {resData.date && <p>{resData.date}</p>}
      <Button onClick={handleClick}>前往今日</Button>
    </>
  );
}

export default StartWorkout;

