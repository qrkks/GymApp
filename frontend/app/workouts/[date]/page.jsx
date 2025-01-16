"use client";

import StartBodyPart from "./WorkoutSet/StartBodyPart";
import {useEffect, useState} from "react";
import useSWR from "swr";
import WorkoutSet from "./WorkoutSet";
import {Button} from "@/components/ui/button";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import DateHead from "./DateHead";

function WorkoutById({params}) {
  const { apiUrl} = config
  const [resData, setResData] = useState({});
  const [isWorkoutCreated, setIsWorkoutCreated] = useState(false);

  // 自定义 fetcher 处理连接错误
  const fetcher = async (url) => {
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      // 如果是连接错误，返回 null 而不是抛出错误
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.log('Connection error, will retry later');
        return null;
      }
      throw error;
    }
  };

  const {
    data: workoutData,
    error: workoutError,
    mutate: mutateWorkout,
  } = useSWR(`${apiUrl}/workout/${params.date}`, fetcher, {
    revalidateOnFocus: false,      // 禁用焦点重新验证
    revalidateOnReconnect: true,   // 网络重连时重新验证
    refreshInterval: 0,            // 禁用自动刷新
    shouldRetryOnError: false,     // 禁用错误自动重试
    dedupingInterval: 5000,        // 增加去重间隔到5秒
    errorRetryCount: 3,            // 最多重试3次
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // 自定义重试逻辑
      if (retryCount >= 3) return;  // 最多重试3次
      if (error.status === 404) return;  // 不重试404错误
      
      // 5秒后重试
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  useEffect(() => {
    // 检查当天是否有 Workout 数据
    if (workoutData !== undefined && workoutData !== null) {
      setIsWorkoutCreated(true); // 数据存在，表示 workout 已创建
    } else {
      setIsWorkoutCreated(false); // 数据为 null，表示未创建
    }
  }, [workoutData]);

  useEffect(() => {
    if (workoutError) {
      console.error('Workout data fetch error:', workoutError);
    }
  }, [workoutError]);

  useEffect(() => {
    if (workoutData) {
      console.log('Workout data updated:', workoutData);
    }
  }, [workoutData]);

  function handleCreateWorkout() {
    // console.log(authStore.getCookie("csrftoken"));
    // 仅当用户主动点击按钮时才创建当天的 Workout
    if (params?.date && !isWorkoutCreated) {
      fetch(`${apiUrl}/workout/create`, {
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

      fetch(`${apiUrl}/workout/${params.date}`, {
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

  const handleMutateWorkout = async () => {
    try {
      await mutateWorkout();
      console.log('Data revalidation triggered');
    } catch (error) {
      console.error('Failed to update data:', error);
    }
  };

  const debugMutate = async () => {
    console.log('Starting mutation...');
    await mutateWorkout();
    console.log('Mutation completed');
  };

  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <div className="flex gap-4 items-center">
      <DateHead params={params}/>
      </div>

      {!isWorkoutCreated && (
        <Button onClick={handleCreateWorkout} className="btn btn-primary">
          开始今日训练
        </Button>
      )}

      {isWorkoutCreated && (
        <>
          <StartBodyPart date={params.date} mutateWorkout={handleMutateWorkout} />
          {/* <pre className="m-auto text-foreground">
            {JSON.stringify(workoutData, null, 2)}
          </pre> */}
          {workoutData?.body_parts?.map((part) => (
            <WorkoutSet
              key={part.id}
              part={part}
              date={params.date}
              mutateWorkout={handleMutateWorkout}
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
