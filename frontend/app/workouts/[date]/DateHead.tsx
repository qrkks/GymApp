import {CircleArrowLeft, CircleArrowRight} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useCallback, KeyboardEvent} from "react";
import { getTodayDate } from "../GoToTodayButton";

interface DateHeadProps {
  params: {
    date: string;
  };
}

function DateHead({params}: DateHeadProps) {
  const router = useRouter();

  const getSomeDate = useCallback((offset: number): string => {
    const currentDate = new Date(params.date);
    currentDate.setDate(currentDate.getDate() + offset);

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, [params.date]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent<Window>) {
      if (event.key === "ArrowLeft") {
        router.push(getSomeDate(-1));
      } else if (event.key === "ArrowRight") {
        router.push(getSomeDate(1));
      }
    }

    window.addEventListener("keydown", handleKeyDown as unknown as EventListener);

    return () => {
      window.removeEventListener("keydown", handleKeyDown as unknown as EventListener);
    };
  }, [router, getSomeDate]);

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

