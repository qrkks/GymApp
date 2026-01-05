"use client";
import Link from "next/link";
import { CircleUser, Menu, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface NavItem {
  name: string;
  href: string;
}

const navList: NavItem[] = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Workouts",
    href: "/workouts",
  },
  {
    name: "Library",
    href: "/exercise-library",
  },
];

export default function NavBar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 gap-4 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* 左侧：移动端（汉堡菜单 + Logo），桌面端（Logo） */}
      <div className="flex gap-2 items-center md:gap-0">
        {/* 移动端菜单按钮 - 放在左侧 */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <SheetDescription className="sr-only">选择要访问的页面</SheetDescription>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="flex gap-2 items-center text-lg font-semibold"
                onClick={() => setIsOpen(false)}
              >
                <Dumbbell className="w-6 h-6" />
                <span className="sr-only">Gym Logo</span>
              </Link>
              {navList.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="transition-colors text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        {/* Logo */}
        <Link
          href="/"
          className="flex gap-2 items-center text-lg font-semibold shrink-0 md:text-base"
        >
          <Dumbbell />
          <span className="sr-only">Gym Logo</span>
        </Link>

      </div>

      {/* 导航菜单 - 中间居中（桌面端） */}
      <nav className="hidden flex-1 justify-center md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {navList.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="transition-colors text-muted-foreground hover:text-foreground"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* 右侧：用户菜单 */}
      <div className="flex gap-2 items-center shrink-0 md:gap-2 lg:gap-4">
        {/* 用户菜单 */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="w-5 h-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/user/profile")}>
                个人资料
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/user/password")}>
                修改密码
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    console.log('正在退出登录...');
                    await signOut({
                      redirect: true,
                      callbackUrl: '/auth/signin'
                    });
                  } catch (error) {
                    console.error('退出登录失败:', error);
                    // 如果signOut失败，强制重定向到登录页面
                    window.location.href = '/auth/signin';
                  }
                }}
              >
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">
                登录
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="default" size="sm">
                注册
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

