"use client";

import StartBodyPart from "./WorkoutSet/StartBodyPart";
import {useEffect, useState} from "react";
import useSWR from "swr";
import WorkoutSet from "./WorkoutSet";
import {Button} from "@/components/ui/button";
import authStore from "@/app/store/authStore";

function WorkoutById({params}) {
  const [resData, setResData] = useState({});
  const [isWorkoutCreated, setIsWorkoutCreated] = useState(false);

  // 自定义 fetcher 处理 404 情况
  const fetcher = async (url) => {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (response.status === 404) {
      return null; // 后端返回 404 表示没有找到对应 Workout
    }
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  };

  const {
    data: workoutData,
    error: workoutError,
    mutate: mutateWorkout,
  } = useSWR(`http://127.0.0.1:8000/api/workout/${params.date}`, fetcher);

  useEffect(() => {
    // 检查当天是否有 Workout 数据
    if (workoutData !== undefined && workoutData !== null) {
      setIsWorkoutCreated(true); // 数据存在，表示 workout 已创建
    } else {
      setIsWorkoutCreated(false); // 数据为 null，表示未创建
    }
  }, [workoutData]);

  function handleCreateWorkout() {
    // console.log(authStore.getCookie("csrftoken"));
    // 仅当用户主动点击按钮时才创建当天的 Workout
    if (params?.date && !isWorkoutCreated) {
      fetch("http://127.0.0.1:8000/api/workout/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": authStore.getCookie("csrftoken"),
        },
        body: JSON.stringify({date: params.date}),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setResData(data); // 更新状态
          setIsWorkoutCreated(true); // 标记为已创建
          mutateWorkout(); // 手动触发重新获取数据
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    }
  }

  // 新增删除 Workout 的逻辑
  function handleDeleteWorkout() {
    if (params?.date && isWorkoutCreated) {
      const isConfirmed = window.confirm("你确定要删除今日的训练吗？");
      if (!isConfirmed) return; // 如果用户取消，退出函数

      fetch(`http://127.0.0.1:8000/api/workout/${params.date}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": authStore.getCookie("csrftoken"),
        },
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          setIsWorkoutCreated(false); // 更新状态为未创建
          mutateWorkout(); // 触发重新获取数据
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h2>{params.date}</h2>

      {!isWorkoutCreated && (
        
        <Button onClick={handleCreateWorkout} className="btn btn-primary">
          开始今日训练
        </Button>
      )}

      {isWorkoutCreated && (
        <>
          <StartBodyPart date={params.date} mutateWorkout={mutateWorkout} />
          {/* <pre className="m-auto text-foreground">
            {JSON.stringify(workoutData, null, 2)}
          </pre> */}
          {workoutData?.body_parts?.map((part) => (
            <WorkoutSet
              key={part.id}
              part={part}
              date={params.date}
              mutateWorkout={mutateWorkout}
            />
          ))}

          {/* 新增的删除按钮 */}
          <button onClick={handleDeleteWorkout} className="btn btn-danger">
            删除今日训练
          </button>
        </>
      )}
    </div>
  );
}

export default WorkoutById;
