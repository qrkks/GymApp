"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Dumbbell,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: CalendarDays,
    title: "按日期安排训练",
    body: "从日历进入任意一天，已有记录会被清晰标记。",
  },
  {
    icon: LineChart,
    title: "保留组数细节",
    body: "重量、次数和笔记集中在同一动作卡片里，复盘更快。",
  },
  {
    icon: BookOpen,
    title: "动作库可维护",
    body: "按训练部位管理动作，减少每次记录前的重复输入。",
  },
];

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Dumbbell className="h-6 w-6" />
        </div>
        <div className="mt-8 max-w-2xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            把每一次训练记录成可追踪的进步
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            记录动作、重量、次数和训练笔记，快速回看历史表现，让下一次训练更有依据。
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="gap-2">
            <Link href="/workouts">
              开始记录
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-white">
            <Link href="/exercise-library">
              管理动作库
              <BookOpen className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
