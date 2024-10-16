"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import { useRouter } from "next/navigation";

function StartWorkout({onStart}) {
  const [resData, setResData] = useState({});
  const router = useRouter();

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需加1
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

  const handleClick = () => {
    router.push(`/workouts/${getTodayDate()}`);
  };
  return (
    <>
      {resData.date && <p>{resData.date}</p>}
      <Button onClick={handleClick}>开始训练</Button>
    </>
  );
}

export default StartWorkout;
