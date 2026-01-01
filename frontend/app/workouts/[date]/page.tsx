"use client";

import StartBodyPart from "./BodyPartSection/StartBodyPart";
import {useEffect, useState} from "react";
import useSWR from "swr";
import BodyPartSection from "./BodyPartSection";
import {Button} from "@/components/ui/button";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";
import DateHead from "./DateHead";
import WorkoutSkeleton from "@/components/loading/WorkoutSkeleton";
import RefreshIndicator from "@/components/loading/RefreshIndicator";
import { useLoadingState } from "@/hooks/useLoadingState";
import type { BodyPart, MutateFunction } from "@/app/types/workout.types";

interface WorkoutData {
  body_parts?: BodyPart[];
  date?: string;
  id?: number;
}

interface WorkoutByIdProps {
  params: {
    date: string;
  };
}

function WorkoutById({params}: WorkoutByIdProps) {
  const { apiUrl} = config
  const [resData, setResData] = useState<WorkoutData>({});
  const [isWorkoutCreated, setIsWorkoutCreated] = useState(false);

  const fetcher = async (url: string) => {
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
      
      return response.json() as Promise<WorkoutData>;
    } catch (error) {
      if (error instanceof Error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.log('Connection error, will retry later');
        return null;
      }
      throw error;
    }
  };

  const {
    data: workoutData,
    error: workoutError,
    isLoading,
    isValidating,
    mutate: mutateWorkout,
  } = useSWR<WorkoutData | null>(`${apiUrl}/workout/${params.date}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return;
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) return;
      
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  const { isInitialLoading, isRefreshing, hasError } = useLoadingState(
    workoutData,
    workoutError,
    isLoading,
    isValidating
  );

  useEffect(() => {
    if (workoutData !== undefined && workoutData !== null) {
      setIsWorkoutCreated(true);
    } else {
      setIsWorkoutCreated(false);
    }
  }, [workoutData]);

  useEffect(() => {
    if (workoutError) {
      console.error('Workout data fetch error:', workoutError);
    }
  }, [workoutError]);

  function handleCreateWorkout() {
    if (params?.date && !isWorkoutCreated) {
      fetch(`${apiUrl}/workout?createOrGet=true`, {
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
          setResData(data);
          setIsWorkoutCreated(true);
          mutateWorkout();
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    }
  }

  function handleDeleteWorkout() {
    if (params?.date && isWorkoutCreated) {
      const isConfirmed = window.confirm("你确定要删除今日的训练吗？");
      if (!isConfirmed) return;

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
          setIsWorkoutCreated(false);
          mutateWorkout();
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    }
  }

  const handleMutateWorkout: MutateFunction = async () => {
    try {
      await mutateWorkout();
      console.log('Data revalidation triggered');
    } catch (error) {
      console.error('Failed to update data:', error);
    }
  };

  // Show skeleton during initial load
  if (isInitialLoading) {
    return <WorkoutSkeleton />;
  }

  // Show error state
  if (hasError && workoutError) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center">
        <div className="text-red-600">加载失败，请刷新页面重试</div>
        <Button onClick={() => mutateWorkout()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      {isRefreshing && (
        <RefreshIndicator className="fixed top-20 right-4 z-50" />
      )}
      
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
          {workoutData?.body_parts?.map((part) => (
            <BodyPartSection
              key={part.id}
              part={part}
              date={params.date}
              mutateWorkout={handleMutateWorkout}
            />
          ))}

          <button onClick={handleDeleteWorkout} className="btn btn-danger">
            删除今日训练
          </button>
        </>
      )}
    </div>
  );
}

export default WorkoutById;

