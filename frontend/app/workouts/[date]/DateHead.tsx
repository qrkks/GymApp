import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { getTodayDate } from "../GoToTodayButton";

interface DateHeadProps {
  params: {
    date: string;
  };
}

function formatReadableDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function DateHead({ params }: DateHeadProps) {
  const router = useRouter();

  const getSomeDate = useCallback(
    (offset: number): string => {
      const currentDate = new Date(params.date);
      currentDate.setDate(currentDate.getDate() + offset);

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    },
    [params.date]
  );

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
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">训练记录</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {formatReadableDate(params.date)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用左右方向键也可以切换日期。
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.push(getSomeDate(-1))}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">前一天</span>
        </Button>
        <Button variant="outline" className="gap-2 bg-white" onClick={() => router.push(getTodayDate())}>
          <RotateCcw className="h-4 w-4" />
          今天
        </Button>
        <Button variant="outline" size="icon" onClick={() => router.push(getSomeDate(1))}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">后一天</span>
        </Button>
      </div>
    </div>
  );
}

export default DateHead;
