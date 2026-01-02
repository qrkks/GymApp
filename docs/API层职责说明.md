# API 层职责说明

## 📋 API 层的职责

API 层是一个**适配器层**，负责在 HTTP 协议和领域层之间进行转换。

---

## 🔄 API 层做了什么？

### 1. **认证检查** 🔐
```typescript
const user = await requireAuth();
if (!user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
- 检查用户是否已登录
- 获取当前用户信息
- 未登录返回 401

### 2. **请求数据验证** ✅
```typescript
const body = await request.json();
const data = workoutSchema.parse(body); // Zod 验证
```
- 解析 HTTP 请求体（JSON）
- 使用 Zod 验证数据格式
- 验证失败返回 400

### 3. **调用领域层 Use-Case** 🎯
```typescript
const result = await createWorkout(user.id, {
  date: data.date,
  startTime: new Date(),
});
```
- 调用领域层的 use-case 函数
- 传递业务数据
- 接收 `Result<T>` 类型的结果

### 4. **错误转换** 🔄
```typescript
const response = toHttpResponse(result);
// 将 Result<T> 转换为 HTTP 响应
// { status: 200, body: data } 或 { status: 400, body: { error: "..." } }
```
- 使用 `toHttpResponse` 将领域错误转换为 HTTP 响应
- 错误代码映射到 HTTP 状态码：
  - `USER_ALREADY_EXISTS` → 400
  - `NOT_FOUND` → 404
  - `UNAUTHORIZED` → 401
  - `INTERNAL_ERROR` → 500

### 5. **HTTP 响应** 📤
```typescript
return NextResponse.json(response.body, { status: response.status });
```
- 返回 JSON 格式的 HTTP 响应
- 设置正确的 HTTP 状态码

### 6. **异常处理** ⚠️
```typescript
catch (error: any) {
  if (error instanceof z.ZodError) {
    // Zod 验证错误
    return NextResponse.json({ error: 'Validation error' }, { status: 400 });
  }
  if (error.message === 'Unauthorized') {
    // 认证错误
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // 其他未预期的错误
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```
- 处理 Zod 验证错误
- 处理认证错误
- 处理未预期的异常

---

## 📊 完整流程示例

### 示例：创建训练部位

```typescript
// 1. 接收 HTTP 请求
export async function POST(request: NextRequest) {
  try {
    // 2. 认证检查
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. 解析和验证请求数据
    const body = await request.json();
    const data = bodyPartSchema.parse(body); // { name: "胸部" }

    // 4. 调用领域层
    const result = await createBodyPart(user.id, data.name);
    // result = { success: true, data: BodyPart } 
    // 或 { success: false, error: { code: 'BODY_PART_ALREADY_EXISTS', message: '...' } }

    // 5. 转换为 HTTP 响应
    const response = toHttpResponse(result);
    // 成功: { status: 200, body: BodyPart }
    // 失败: { status: 400, body: { error: "..." } }

    // 6. 返回 HTTP 响应
    return NextResponse.json(response.body, { status: response.status });
    
  } catch (error: any) {
    // 7. 处理异常
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 🎯 API 层的核心作用

### 转换职责

| 方向 | 转换内容 |
|------|---------|
| **HTTP → 领域** | HTTP 请求 → Use-Case 调用 |
| **领域 → HTTP** | `Result<T>` → HTTP 响应 |

### 处理职责

1. **HTTP 层面**：
   - 认证（`requireAuth`）
   - 请求验证（Zod）
   - HTTP 状态码
   - JSON 序列化

2. **领域层面**：
   - 调用 Use-Case
   - 接收 `Result<T>`
   - 转换错误为 HTTP

---

## 💡 为什么需要 API 层？

### 1. **解耦**
- 领域层不依赖 HTTP 协议
- 可以轻松替换为其他协议（gRPC、GraphQL 等）

### 2. **统一转换**
- 所有领域错误统一转换为 HTTP 响应
- 使用 `toHttpResponse` 保证一致性

### 3. **HTTP 特定处理**
- 处理 HTTP 认证
- 处理 HTTP 请求格式
- 处理 HTTP 响应格式

---

## 📝 总结

**API 层做了 6 件事：**

1. ✅ **认证检查** - 确保用户已登录
2. ✅ **请求验证** - 验证 HTTP 请求数据格式
3. ✅ **调用 Use-Case** - 调用领域层业务逻辑
4. ✅ **错误转换** - 将领域错误转换为 HTTP 响应
5. ✅ **HTTP 响应** - 返回 JSON 格式的 HTTP 响应
6. ✅ **异常处理** - 处理 HTTP 层面的异常

**核心价值：**
- 🔄 **适配器**：HTTP ↔ 领域层
- 🛡️ **保护层**：处理 HTTP 特定问题，保护领域层
- 🎯 **统一转换**：统一错误转换，保证一致性

