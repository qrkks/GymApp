"use client";
import StartWorkout from "./components/StartWorkout";
import React, {useState} from "react";
import {Calendar} from "@/components/ui/calendar";
import {useRouter} from "next/navigation";

function Workouts() {
  // const [trainingStatus, setTrainingStatus] = useState('before');

  // const beforeTraining = () => setTrainingStatus("before");
  // const startTraining = () => setTrainingStatus("training");
  // const endTraining = () => setTrainingStatus("finished");
  // const pauseTraining = () => setTrainingStatus("pause");
  // 如果你确定要传递一个 Date 对象，去掉类型定义
  const [date, setDate] = useState(new Date());
  const router = useRouter();

  function handleSelect(date) {
    // router.push(`/workouts/${date.toISOString().slice(0, 10)}`);
    setDate(date);
    console.log(date.toISOString().slice(0, 10));
  }

  // function handleDoubleClick(value) {
  //   router.push(`/workouts/${value.toISOString().slice(0, 10)}`);
  // }

  return (
    <div className="flex flex-col gap-4">
      <StartWorkout />
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        // onDoubleClick={handleDoubleClick}
        // onSelect={setDate}
        className="border rounded-md shadow"
      />
      <div>{JSON.stringify(date)}</div>
    </div>
  );
}

export default Workouts;
