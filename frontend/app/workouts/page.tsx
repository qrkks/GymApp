"use client";
import StartWorkout from "./GoToTodayButton";
import React, {useState, useEffect} from "react";
import {Calendar} from "@/components/ui/calendar";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import type { DateRange } from "react-day-picker";

function Workouts() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    setDate(new Date());
  }, []);

  function handleSelect(selectedDate: Date | undefined) {
    setDate(selectedDate);
    if (selectedDate) {
      console.log(selectedDate.toLocaleDateString().slice(0, 10));
    }
  }

  function handleClick() {
    if (!date) return;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;

    router.push(`/workouts/${formattedDate}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <StartWorkout />
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        className="border rounded-md shadow"
      />
      <Button onClick={handleClick}>
        {date ? `前往 ${date.toLocaleDateString()}` : "没有选择日期"}
      </Button>
    </div>
  );
}

export default Workouts;

