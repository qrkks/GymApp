import Link from "next/link";
import { CloudOff, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <section className="mx-auto max-w-lg rounded-xl border bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        <CloudOff className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">当前处于离线状态</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        已经访问并同步过的训练页仍可使用。离线添加的训练组会保存在本机，恢复网络后自动同步。
      </p>
      <Button asChild className="mt-6 gap-2">
        <Link href="/workouts">
          <Dumbbell className="h-4 w-4" />
          打开训练记录
        </Link>
      </Button>
    </section>
  );
}
