"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CircleUser,
  Dumbbell,
  Home,
  LogIn,
  Menu,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navList: NavItem[] = [
  {
    name: "首页",
    href: "/",
    icon: Home,
  },
  {
    name: "训练",
    href: "/workouts",
    icon: CalendarDays,
  },
  {
    name: "动作库",
    href: "/exercise-library",
    icon: BookOpen,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export default function NavBar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const displayName = session?.user?.name || session?.user?.email || "账户";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/80 bg-white/88 backdrop-blur-xl supports-[backdrop-filter]:bg-white/76">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 md:gap-0">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开导航菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Dumbbell className="h-5 w-5" />
                  </span>
                  Lift Log
                </SheetTitle>
                <SheetDescription className="text-left">
                  选择要打开的训练工作区。
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-8 grid gap-2 text-sm font-medium">
                {navList.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                      isActivePath(pathname, item.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </span>
            <span>Lift Log</span>
          </Link>
        </div>

        <nav className="hidden flex-1 justify-center md:flex md:flex-row md:items-center md:gap-2 md:text-sm">
          {navList.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors",
                isActivePath(pathname, item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:gap-2 lg:gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2 rounded-full px-2.5 sm:px-3">
                  <CircleUser className="h-5 w-5" />
                  <span className="hidden max-w-32 truncate text-xs sm:inline">
                    {displayName}
                  </span>
                  <span className="sr-only">打开用户菜单</span>
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
                      await signOut({
                        redirect: true,
                        callbackUrl: "/auth/signin",
                      });
                    } catch (error) {
                      console.error("Sign out failed", error);
                      window.location.href = "/auth/signin";
                    }
                  }}
                >
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href="/auth/signin">
                  <LogIn className="h-4 w-4" />
                  登录
                </Link>
              </Button>
              <Button asChild variant="default" size="sm" className="gap-1.5">
                <Link href="/auth/signup">
                  <UserPlus className="h-4 w-4" />
                  注册
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
