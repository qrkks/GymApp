"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { status } = useSession();
  const [formData, setFormData] = useState<FormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("新密码和确认密码不匹配");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("新密码长度至少为 6 个字符");
      setLoading(false);
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError("新密码不能与当前密码相同");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "修改密码失败，请检查输入信息后重试";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSuccess("密码修改成功，请使用新密码登录");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err) {
      console.error("Change password request failed:", err);
      setError("网络连接失败，请检查网络后重试");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pt-28">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">修改密码</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            更改你的账户密码
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
          <div>
            <Label htmlFor="oldPassword">当前密码</Label>
            <PasswordInput
              id="oldPassword"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="请输入当前密码"
              className="mt-1 bg-white"
              autoComplete="current-password"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">新密码</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="至少 6 个字符"
              className="mt-1 bg-white"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              密码长度至少为 6 个字符
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="再次输入新密码"
              className="mt-1 bg-white"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded bg-green-50 p-3 text-sm text-green-700">
              {success}
              <p className="mt-2 text-xs">3 秒后将自动跳转到登录页面...</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "修改中..." : "修改密码"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/user/profile")}
              disabled={loading}
              className="flex-1 bg-white"
            >
              返回
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/user/profile" className="text-primary hover:underline">
            返回个人资料
          </Link>
        </div>
      </div>
    </div>
  );
}
