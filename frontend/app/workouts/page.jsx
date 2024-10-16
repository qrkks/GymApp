"use client";
import StartWorkout from "./components/StartWorkout";
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";

function Workouts() {
  const [date, setDate] = useState(null); // 初始化为空，避免服务器端渲染和客户端渲染不一致
  const router = useRouter();

  useEffect(() => {
    // 在客户端渲染后才设置当前日期，避免服务端渲染和客户端渲染时间不同
    setDate(new Date());
  }, []);

  function handleSelect(selectedDate) {
    setDate(selectedDate);
    console.log(selectedDate.toISOString().slice(0, 10));
  }

  return (
    <div className="flex flex-col gap-4">
      <StartWorkout />
      {date ? (
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          className="border rounded-md shadow"
        />
      ) : (
        <div>Loading...</div> // 在 date 尚未被初始化时显示 Loading
      )}
      <div>{JSON.stringify(date)}</div>
    </div>
  );
}

export default Workouts;
