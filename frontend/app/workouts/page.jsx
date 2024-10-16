"use client";
import StartWorkout from "./components/StartWorkout";
import React, {useState, useEffect} from "react";
import {Calendar} from "@/components/ui/calendar";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

function Workouts() {
  const [date, setDate] = useState(null); // 初始化为空，避免服务器端渲染和客户端渲染不一致
  const router = useRouter();

  useEffect(() => {
    // 在客户端渲染后才设置当前日期，避免服务端渲染和客户端渲染时间不同
    setDate(new Date());
  }, []);

  function handleSelect(selectedDate) {
    setDate(selectedDate);
    console.log(selectedDate && selectedDate.toLocaleDateString().slice(0, 10));
  }

  function handleClick() {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从0开始，所以加1
    const day = String(date.getDate()).padStart(2, "0"); // 确保日是两位数

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
      {/* <div>{JSON.stringify(date)}</div> */}
    </div>
  );
}

export default Workouts;
