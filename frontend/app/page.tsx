"use client";

export default function Home() {
  return (
    <div className="container px-4 py-8 pt-28 mx-auto">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">欢迎使用训练记录系统</h1>
        <p className="text-lg text-muted-foreground">
          开始记录你的训练数据，追踪你的健身进度
        </p>
        <div className="mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            • 记录训练数据
          </p>
          <p className="text-sm text-muted-foreground">
            • 管理训练动作库
          </p>
          <p className="text-sm text-muted-foreground">
            • 查看历史训练记录
          </p>
        </div>
      </div>
    </div>
  );
}

