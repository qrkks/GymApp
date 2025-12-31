"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  image: string | null;
}

interface FormData {
  username: string;
  email: string;
  image: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    image: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 检查登录状态
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 获取用户信息
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserProfile();
    }
  }, [status, session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/me");
      if (!response.ok) {
        throw new Error("获取用户信息失败");
      }
      const data = await response.json();
      setUser(data);
      setFormData({
        username: data.username || "",
        email: data.email || "",
        image: data.image || "",
      });
    } catch (err) {
      console.error("获取用户信息失败:", err);
      setError("获取用户信息失败，请刷新页面重试");
    }
  };

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

    try {
      // 只发送有变化的字段
      const updateData: Partial<FormData> = {};
      if (formData.username !== user?.username) {
        updateData.username = formData.username;
      }
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      if (formData.image !== (user?.image || "")) {
        updateData.image = formData.image || null;
      }

      // 如果没有变化，直接返回
      if (Object.keys(updateData).length === 0) {
        setSuccess("没有需要更新的内容");
        setLoading(false);
        setIsEditing(false);
        return;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "更新失败，请检查输入信息后重试";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSuccess("个人资料更新成功！");
      setIsEditing(false);
      // 重新获取用户信息
      await fetchUserProfile();
    } catch (err) {
      console.error("更新用户资料失败:", err);
      setError("网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        image: user.image || "",
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-20">
        <div className="text-center">
          <p className="text-red-600">{error || "无法加载用户信息"}</p>
          <Button onClick={fetchUserProfile} className="mt-4">
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-28 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">个人资料</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            管理你的账户信息和设置
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
          <div>
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              disabled={!isEditing || loading}
              required
              placeholder="请输入用户名"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              用户名将用于登录和显示
            </p>
          </div>

          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing || loading}
              required
              placeholder="your@email.com"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              邮箱将用于登录和接收通知
            </p>
          </div>

          <div>
            <Label htmlFor="image">头像链接（可选）</Label>
            <Input
              id="image"
              name="image"
              type="url"
              value={formData.image}
              onChange={handleChange}
              disabled={!isEditing || loading}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              输入头像图片的 URL 地址
            </p>
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <div className="flex gap-4">
            {!isEditing ? (
              <>
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  编辑资料
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/user/password")}
                  className="flex-1"
                >
                  修改密码
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "保存中..." : "保存更改"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  取消
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

