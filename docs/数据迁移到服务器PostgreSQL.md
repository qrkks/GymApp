# 数据迁移到服务器 PostgreSQL

## 目标

将本地 `db.sqlite` 的数据迁移到服务器上的 PostgreSQL 数据库。

## 前置条件

1. **本地 SQLite 文件存在**：`frontend/db.sqlite`
2. **服务器 PostgreSQL 已运行**：可以通过网络访问
3. **安装依赖**（如果还没有）：
   ```bash
   cd frontend
   pnpm add -D better-sqlite3 tsx
   pnpm add @types/better-sqlite3
   ```

## 迁移步骤

### 1. 准备服务器 PostgreSQL 连接信息

你需要知道：
- 服务器地址（IP 或域名）
- PostgreSQL 端口（默认 5432）
- 数据库名称（通常是 `gymapp`）
- 用户名（通常是 `postgres`）
- 密码（从服务器的 `.env` 文件中获取）

连接字符串格式：
```
postgresql://用户名:密码@服务器地址:5432/数据库名
```

示例：
```
postgresql://postgres:your_password@your-server.com:5432/gymapp
```

### 2. 运行迁移脚本

```bash
cd frontend

# 运行迁移脚本
tsx scripts/migrate-sqlite-to-server-pg.ts ./db.sqlite "postgresql://postgres:password@your-server:5432/gymapp"
```

**注意**：
- 替换 `your-server` 为你的服务器地址
- 替换 `password` 为你的 PostgreSQL 密码
- 如果服务器端口不是 5432，修改端口号

### 3. 验证迁移结果

脚本会自动验证迁移结果，显示每个表的记录数对比：

```
🔍 验证迁移结果...

  ✅ users: SQLite=5, PostgreSQL=5
  ✅ body_parts: SQLite=12, PostgreSQL=12
  ✅ exercises: SQLite=25, PostgreSQL=25
  ...
```

## 迁移过程说明

脚本会按以下顺序迁移数据（按依赖关系）：

1. **users** - 用户表
2. **body_parts** - 身体部位表
3. **exercises** - 动作表
4. **workouts** - 训练表
5. **workout_body_parts** - 训练-身体部位关联表
6. **workout_sets** - 训练组表
7. **sets** - 组表

## 注意事项

### 1. 数据冲突处理

- 如果记录已存在（基于主键或唯一约束），会跳过插入（`ON CONFLICT DO NOTHING`）
- 这意味着可以安全地多次运行脚本，不会重复插入

### 2. 时间戳转换

- SQLite 的时间戳会自动转换为 PostgreSQL 的 `TIMESTAMP` 格式
- 支持多种时间格式（字符串、Unix 时间戳等）

### 3. 外键关系

- 确保按依赖顺序迁移（脚本已处理）
- 如果外键关联失败，会显示错误信息

### 4. 网络连接

- 确保本地可以访问服务器的 PostgreSQL 端口
- 如果服务器有防火墙，需要开放 5432 端口（或你配置的端口）

## 已修复问题

### 列名大小写问题 ✅

**问题**：迁移时出现 `column "emailverified" of relation "users" does not exist` 错误

**原因**：PostgreSQL 表使用了带双引号的驼峰列名（如 `"emailVerified"`、`"createdAt"`），但 INSERT 语句未加引号，导致列名被转换为小写。

**解决方案**：已在脚本中修复，所有列名和表名都使用双引号包裹，保持大小写。

## 故障排除

### 连接失败

```
❌ 迁移失败: connect ECONNREFUSED
```

**解决方案**：
1. 检查服务器地址和端口是否正确
2. 检查 PostgreSQL 服务是否运行
3. 检查防火墙设置

### 认证失败

```
❌ 迁移失败: password authentication failed
```

**解决方案**：检查用户名和密码是否正确

### 表不存在

```
❌ 迁移失败: relation "users" does not exist
```

**解决方案**：确保服务器上的数据库已经运行过迁移（`drizzle-kit migrate`）

## 安全建议

1. **使用环境变量传递密码**（避免在命令行中暴露）：
   ```bash
   export POSTGRES_PASSWORD="your_password"
   tsx scripts/migrate-sqlite-to-server-pg.ts ./db.sqlite "postgresql://postgres:${POSTGRES_PASSWORD}@server:5432/gymapp"
   ```

2. **使用 SSH 隧道**（更安全）：
   ```bash
   ssh -L 5432:localhost:5432 user@your-server
   tsx scripts/migrate-sqlite-to-server-pg.ts ./db.sqlite "postgresql://postgres:password@localhost:5432/gymapp"
   ```

## 验证迁移

脚本会自动验证迁移结果。迁移完成后，建议：

1. **检查脚本输出**：确认所有表的记录数匹配
2. **通过应用验证**：登录应用，检查数据是否正常显示

## 备份建议

迁移前建议备份本地 SQLite 文件：
```bash
cp frontend/db.sqlite frontend/db.sqlite.backup.$(date +%Y%m%d)
```

---

**迁移完成后，数据已成功迁移到服务器的 PostgreSQL！** 🎉

