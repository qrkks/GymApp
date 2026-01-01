"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 客户端验证
    if (formData.password !== formData.confirmPassword) {
      setError("密码和确认密码不匹配");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("密码长度至少为 6 个字符");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 显示服务器返回的具体错误信息
        const errorMessage = data.error || "注册失败，请检查输入信息后重试";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // 注册成功，跳转到登录页面
      router.push("/auth/signin?registered=true");
    } catch (err) {
      console.error('注册请求失败:', err);
      setError("网络连接失败，请检查网络后重试");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center -mt-20 w-full">
      <div className="w-full max-w-lg space-y-8 rounded-lg border p-8 mx-auto">
        <div>
          <h2 className="text-2xl font-bold">注册</h2>
          <p className="mt-2 text-sm text-gray-600">
            创建你的账户以开始使用
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="请输入用户名（唯一）"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="至少 6 个字符"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="再次输入密码"
              className="mt-1"
            />
          </div>
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>
        <div className="text-center text-sm text-gray-600">
          已有账户？{" "}
          <Link href="/auth/signin" className="text-primary hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}

