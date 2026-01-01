"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<FormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 检查登录状态
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

    // 客户端验证
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
      setError("新密码不能与旧密码相同");
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

      setSuccess("密码修改成功！请使用新密码登录");
      // 清空表单
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err) {
      console.error("修改密码失败:", err);
      setError("网络连接失败，请检查网络后重试");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-20">
        <div className="text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-28 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">修改密码</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            更改你的账户密码
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
          <div>
            <Label htmlFor="oldPassword">当前密码</Label>
            <Input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={formData.oldPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="请输入当前密码"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">新密码</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="至少 6 个字符"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              密码长度至少为 6 个字符
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="再次输入新密码"
              className="mt-1"
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded bg-green-50 p-3 text-sm text-green-600">
              {success}
              <p className="mt-2 text-xs">
                3 秒后将自动跳转到登录页面...
              </p>
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
              className="flex-1"
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

