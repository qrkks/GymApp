"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");

  // 获取回调 URL（登录后要跳转的页面）
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("注册成功！请登录");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth 返回的错误通常是通用的，我们根据错误类型显示更具体的提示
        if (result.error === 'CredentialsSignin') {
          setError("用户名/邮箱或密码错误，请检查后重试");
        } else {
          setError("登录失败，请检查用户名/邮箱和密码");
        }
      } else {
        // 登录成功，跳转到回调 URL 或首页
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error('登录请求失败:', err);
      setError("网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center -mt-20 w-full">
      <div className="p-8 mx-auto space-y-8 w-full max-w-sm rounded-lg border">
        <div>
          <h2 className="text-2xl font-bold">登录</h2>
          <p className="mt-2 text-sm text-gray-600">
            使用用户名或邮箱登录你的账户
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifier">用户名或邮箱</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
              required
              placeholder="用户名或 your@email.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              placeholder="请输入密码"
              className="mt-1"
            />
          </div>
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
        <div className="text-sm text-center text-gray-600">
          还没有账户？{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}

