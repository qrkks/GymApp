import {CircleArrowLeft, CircleArrowRight} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import { getTodayDate } from "../GoToTodayButton";

function DateHead({params}) {
  const router = useRouter();

  // 获取偏移日期
  function getSomeDate(offset) {
    const currentDate = new Date(params.date);
    currentDate.setDate(currentDate.getDate() + offset);

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") {
        router.push(getSomeDate(-1));
      } else if (event.key === "ArrowRight") {
        router.push(getSomeDate(1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [params.date, router]);

  return (
    <>
      <CircleArrowLeft
        className="w-4 text-gray-500 cursor-pointer"
        onClick={() => router.push(getSomeDate(-1))}
      />
      <h2
        className="cursor-pointer"
        onClick={() => router.push(getTodayDate())}
      >
        {params.date}
      </h2>
      <CircleArrowRight
        className="w-4 text-gray-500 cursor-pointer"
        onClick={() => router.push(getSomeDate(1))}
      />
    </>
  );
}

export default DateHead;
