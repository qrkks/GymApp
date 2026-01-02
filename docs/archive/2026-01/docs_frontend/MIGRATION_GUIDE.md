# 迁移指南：从 Django 后端迁移到 Next.js + Drizzle

## 概述

本项目已从 Django + Django Ninja 后端迁移到 Next.js + Drizzle ORM 全栈架构。

## 已完成的工作

### 1. 数据库 Schema
- ✅ 使用 Drizzle ORM 定义了所有数据模型
- ✅ 位置：`lib/db/schema.ts`
- ✅ 包含：User, BodyPart, Exercise, Workout, WorkoutSet, Set, WorkoutBodyPart

### 2. 认证系统
- ✅ 使用 NextAuth.js v5 实现认证
- ✅ 位置：`app/api/auth/[...nextauth]/route.ts`
- ✅ 当前使用简单的 email-based 认证（开发环境）
- ⚠️ 生产环境需要实现密码哈希

### 3. API Routes
所有 API endpoints 已迁移到 Next.js API Routes：

- ✅ `/api/bodypart` - BodyPart CRUD
- ✅ `/api/exercise` - Exercise CRUD
- ✅ `/api/workout` - Workout CRUD
- ✅ `/api/workoutset` - WorkoutSet CRUD
- ✅ `/api/set` - Set CRUD
- ✅ `/api/last-workout-first-set` - 获取上次训练的第一组
- ✅ `/api/last-workout-all-sets` - 获取上次训练的所有组

### 4. 前端配置
- ✅ 更新了 `utils/config.js` 以支持内部 API routes
- ✅ 默认使用 `/api` 作为 API 基础路径

## 安装步骤

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 设置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置：
- `DATABASE_PATH`: SQLite 数据库路径
- `NEXTAUTH_SECRET`: 生成一个随机密钥（可以使用 `openssl rand -base64 32`）

### 3. 初始化数据库

生成数据库迁移：

```bash
npm run db:generate
```

应用迁移（创建数据库表）：

```bash
npm run db:push
```

或者使用迁移：

```bash
npm run db:migrate
```

### 4. 数据迁移（从 Django SQLite）

如果你有现有的 Django 数据库，需要迁移数据：

1. 导出 Django 数据（使用 Django 管理命令或直接导出 SQLite）
2. 编写迁移脚本将数据导入新的 Drizzle schema

**注意**：用户表结构不同，需要：
- Django User → NextAuth User
- 需要创建用户映射

### 5. 运行开发服务器

```bash
npm run dev
```

## API 路径变更

### 旧路径（Django）
- `http://localhost:8000/api/bodypart`
- `http://localhost:8000/api/exercise`
- 等等...

### 新路径（Next.js）
- `/api/bodypart`（相对路径，自动使用当前域名）
- `/api/exercise`
- 等等...

前端代码中的 `config.apiUrl` 会自动处理这个变更。

## 认证变更

### 旧方式（Django Session）
- 使用 Cookie-based session
- CSRF token 验证

### 新方式（NextAuth.js）
- 使用 JWT token
- 通过 `getServerSession` 获取当前用户
- API routes 使用 `requireAuth()` 辅助函数

## 待完成的工作

### 1. 前端 API 调用更新
- [ ] 检查所有前端组件中的 API 调用
- [ ] 确保使用正确的路径和认证方式
- [ ] 移除 CSRF token 相关代码（NextAuth 不需要）

### 2. 认证流程
- [ ] 创建登录页面（`/auth/signin`）
- [ ] 实现注册流程（如果需要）
- [ ] 更新前端认证 store

### 3. 数据迁移脚本
- [ ] 创建从 Django SQLite 到新数据库的迁移脚本
- [ ] 处理用户数据映射

### 4. 测试
- [ ] 测试所有 API endpoints
- [ ] 测试认证流程
- [ ] 端到端测试

## 注意事项

1. **数据库路径**：确保 `DATABASE_PATH` 指向正确的 SQLite 文件
2. **认证**：当前认证是简化版本，生产环境需要：
   - 密码哈希（bcrypt）
   - 注册流程
   - 密码重置功能
3. **类型安全**：所有 API routes 使用 TypeScript 和 Zod 验证
4. **错误处理**：所有 API routes 都有统一的错误处理

## 回滚方案

如果需要回滚到 Django 后端：

1. 恢复 `utils/config.js` 中的 `NEXT_PUBLIC_API_URL`
2. 确保 Django 后端正在运行
3. 前端会自动使用外部 API

## 问题排查

### 数据库连接错误
- 检查 `DATABASE_PATH` 是否正确
- 确保数据库文件有写入权限

### 认证错误
- 检查 `NEXTAUTH_SECRET` 是否设置
- 检查 session 配置

### API 404 错误
- 确保 API routes 文件在正确的位置
- 检查路由路径是否正确

## 下一步

1. 测试所有功能
2. 实现完整的认证流程
3. 创建数据迁移脚本
4. 部署到生产环境

