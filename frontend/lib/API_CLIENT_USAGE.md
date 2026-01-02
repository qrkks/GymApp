# API 客户端使用指南

## 概述

统一的 API 客户端会自动处理以下情况：
- ✅ **401 未授权**：自动跳转到登录页面
- ✅ **错误处理**：统一格式化错误响应
- ✅ **请求配置**：自动添加 credentials 和 Content-Type

## 使用方式

### 方式 1：在 React 组件中使用（推荐）

```tsx
'use client';

import { useApiClient, hasError, getErrorMessage } from '@/lib/api-client-hook';
import { useState } from 'react';

export function MyComponent() {
  const api = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);

    const response = await api.get('/body-part');

    if (hasError(response)) {
      setError(getErrorMessage(response));
    } else {
      // 使用 response.data
      console.log(response.data);
    }

    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleFetch}>获取数据</button>
      {error && <p>错误: {error}</p>}
    </div>
  );
}
```

### 方式 2：在非 React 组件中使用

```typescript
import { apiClient, hasError, getErrorMessage } from '@/lib/api-client';

// GET 请求
const response = await apiClient.get('/body-part');
if (!hasError(response)) {
  console.log(response.data);
}

// POST 请求
const createResponse = await apiClient.post('/body-part', {
  name: 'Chest',
});

// PUT 请求
const updateResponse = await apiClient.put('/user/profile', {
  username: 'newusername',
});

// DELETE 请求
const deleteResponse = await apiClient.delete('/body-part/1');
```

## 401 处理机制

### 自动跳转逻辑

当 API 返回 401 状态码时：
1. **React 组件中**：使用 `useApiClient()`，会通过 Next.js router 跳转（不刷新页面）
2. **非 React 代码中**：使用 `apiClient`，会通过 `window.location.href` 跳转（刷新页面）

### 自定义 401 处理

如果需要自定义 401 处理逻辑：

```typescript
import { ApiClient } from '@/lib/api-client';

const customClient = new ApiClient({
  onUnauthorized: () => {
    // 自定义处理逻辑
    console.log('用户未登录');
    // 可以显示提示、清除本地数据等
    window.location.href = '/auth/signin';
  },
});
```

## 错误处理

### 检查错误

```typescript
import { hasError, getErrorMessage } from '@/lib/api-client-hook';

const response = await api.get('/endpoint');

if (hasError(response)) {
  const errorMsg = getErrorMessage(response);
  // 处理错误
}
```

### 错误类型

API 响应可能包含以下错误格式：
- `string`: 简单错误消息
- `string[]`: 多个错误消息
- `object`: 复杂错误对象（如 Zod 验证错误）

`getErrorMessage()` 会自动处理这些格式。

## 迁移现有代码

### 之前（使用 fetch）

```typescript
fetch('/api/body-part', {
  method: 'GET',
  credentials: 'include',
})
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      // 手动处理错误
    }
    // 使用 data
  })
  .catch(error => {
    // 手动处理错误
  });
```

### 之后（使用 API 客户端）

```typescript
const response = await api.get('/body-part');

if (hasError(response)) {
  // 处理错误（401 已自动跳转）
  console.error(getErrorMessage(response));
} else {
  // 使用 response.data
  console.log(response.data);
}
```

## 最佳实践

1. **统一使用 API 客户端**：所有 API 调用都通过客户端，确保一致的错误处理
2. **使用 TypeScript 类型**：为 API 响应定义类型
   ```typescript
   interface BodyPart {
     id: number;
     name: string;
   }
   
   const response = await api.get<BodyPart[]>('/body-part');
   ```
3. **错误处理**：始终检查 `hasError()`，不要假设请求一定成功
4. **加载状态**：在 UI 中显示加载状态，提升用户体验

## 注意事项

- ✅ **401 会自动跳转**：不需要手动处理 401 错误
- ✅ **其他错误需要手动处理**：4xx/5xx 错误会返回在 `response.error` 中
- ✅ **网络错误**：会被捕获并返回在 `response.error` 中
- ⚠️ **不要在 API 路由中重定向**：API 应该返回状态码，由前端处理跳转

