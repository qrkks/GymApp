# PostgreSQL 数据库管理

## 概述

项目已迁移至 PostgreSQL，使用 Drizzle ORM 进行数据库管理。数据库模式通过 TypeScript 定义，迁移通过 Drizzle Kit 管理。

## 可用的数据库脚本

### 模式生成

生成 SQL 迁移文件：

```bash
pnpm run db:generate
```

### 数据库迁移

应用挂起的迁移到数据库：

```bash
pnpm run db:migrate
```

### 直接推送模式

直接将当前模式推送到数据库（开发环境）：

```bash
pnpm run db:push
```

### 生产数据导入

从归档脚本导入生产数据（一次性使用）：

```bash
pnpm run db:import-production
```

## 环境配置

### 本地开发

创建 `.env.local` 文件：

```bash
# PostgreSQL 连接配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gymapp_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# 或使用 DATABASE_URL
# DATABASE_URL=postgresql://user:password@localhost:5432/gymapp_dev
```

### Docker 部署

使用 `docker-compose.yml` 自动启动 PostgreSQL：

```bash
docker-compose up -d
```

## 数据库表结构

项目包含以下表：

- `users` - 用户账户
- `body_parts` - 身体部位
- `exercises` - 运动项目
- `workouts` - 训练记录
- `workout_body_parts` - 训练-身体部位关联
- `workout_sets` - 训练组
- `sets` - 具体训练数据

## 归档脚本

`archive/` 目录包含一次性使用的脚本：

- `import-production-db.ts` - 生产数据迁移脚本
- `reset-all-passwords.ts` - 批量密码重置脚本

## 注意事项

1. **迁移优先**: 始终使用 `db:migrate` 而不是手动执行 SQL
2. **备份重要**: 生产环境操作前务必备份数据
3. **连接池**: PostgreSQL 使用连接池，注意并发连接数
4. **事务**: 复杂操作使用 Drizzle 的事务支持

## 故障排除

### 连接问题

```bash
# 检查 PostgreSQL 状态
pg_isready -h localhost -p 5432

# 查看连接信息
psql -h localhost -U postgres -d gymapp_dev -c "SELECT version();"
```

### 迁移失败

```bash
# 检查当前迁移状态
pnpm run db:migrate --dry-run

# 强制推送（仅开发环境）
pnpm run db:push
```
