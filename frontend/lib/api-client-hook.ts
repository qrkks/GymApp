/**
 * React Hook for API Client
 * 在 React 组件中使用 API 客户端
 */
'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { apiClient, ApiClient, ApiResponse } from './api-client';

/**
 * 使用 API 客户端的 Hook
 * 自动处理认证失败跳转
 */
export function useApiClient() {
  const router = useRouter();

  // 创建带有路由跳转的客户端实例
  const client = useCallback(() => {
    return new ApiClient({
      onUnauthorized: () => {
        // 使用 Next.js router 跳转（更平滑，不会刷新页面）
        const currentPath = window.location.pathname;
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      },
    });
  }, [router]);

  return client();
}

/**
 * 直接使用默认 API 客户端（适用于非 React 组件）
 */
export { apiClient };

/**
 * 辅助函数：检查响应是否有错误
 */
export function hasError<T>(response: ApiResponse<T>): response is { error: string | string[] } {
  return 'error' in response && response.error !== undefined;
}

/**
 * 辅助函数：获取错误消息
 */
export function getErrorMessage(response: ApiResponse): string {
  if (!response.error) return '未知错误';
  
  if (typeof response.error === 'string') {
    return response.error;
  }
  
  if (Array.isArray(response.error)) {
    return response.error.join(', ');
  }
  
  return '请求失败';
}

