"use client";

import StartBodyPart from "./components/StartBodyPart";
import {useEffect, useState} from "react";
import useSWR from "swr";
import WorkoutSet from "./components/WorkoutSet";

function WorkoutById({params}) {
  const [resData, setResData] = useState({});

  useEffect(() => {
    // 根据 date 创建或获取当天的 Workout
    if (params?.date) {
      fetch("http://127.0.0.1:8000/api/workout/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({date: params.date}),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setResData(data); // 正确更新状态
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    }
  }, [params?.date]); // 添加依赖项，监听 params.date 的变化

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const {
    data: workoutData,
    error: workoutError,
    mutate: mutateWorkout,
  } = useSWR(`http://127.0.0.1:8000/api/workout/${params.date}`, fetcher);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h2>{params.date}</h2>
      {/* <pre>{JSON.stringify(resData, null, 2)}</pre> */}
      <StartBodyPart date={params.date} mutateWorkout={mutateWorkout} />
      <pre className="m-auto text-foreground">
        {JSON.stringify(workoutData, null, 2)}
      </pre>
      {workoutData?.body_parts?.map((part) => (
        <WorkoutSet
          key={part.id}
          part={part}
          date={params.date}
          mutateWorkout={mutateWorkout}
        />
      ))}
    </div>
  );
}

export default WorkoutById;
