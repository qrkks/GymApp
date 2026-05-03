"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("注册成功，请登录");
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
        if (result.error === "CredentialsSignin") {
          setError("登录失败，请检查用户名/邮箱和密码");
        } else {
          setError("登录失败，请稍后重试");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Sign in request failed:", err);
      setError("网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center -mt-20">
      <div className="mx-auto w-full max-w-sm space-y-8 rounded-lg border bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">登录</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
              placeholder="请输入用户名或邮箱"
              className="mt-1 bg-white"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              placeholder="请输入密码"
              className="mt-1 bg-white"
              autoComplete="current-password"
            />
          </div>
          {success && (
            <div className="rounded bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          还没有账户？{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
