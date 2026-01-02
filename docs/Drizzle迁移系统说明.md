# Drizzle 迁移系统说明

## `db:push` vs `db:migrate` 的区别

### `db:push`（直接同步）

**工作原理：**
- 直接比较 `schema.ts` 和数据库当前状态
- 自动生成并执行 SQL 来同步差异
- **不创建迁移文件**
- **不维护迁移历史表**（`__drizzle_migrations`）

**特点：**
- ✅ 快速、简单
- ✅ 适合开发环境
- ✅ 自动处理 schema 变更
- ❌ 无法追踪变更历史
- ❌ 不适合生产环境
- ❌ 无法回滚

**使用场景：**
- 开发阶段快速迭代
- 原型开发
- 本地开发环境

---

### `db:migrate`（迁移系统）

**工作原理：**
1. `db:generate` - 生成迁移文件（SQL 文件）
2. `db:migrate` - 执行迁移文件，并记录到 `__drizzle_migrations` 表

**特点：**
- ✅ 可追踪变更历史
- ✅ 适合生产环境
- ✅ 可以版本控制迁移文件
- ✅ 团队协作友好
- ❌ 需要两步操作（generate + migrate）
- ❌ 如果表已存在会报错

**使用场景：**
- 生产环境
- 团队协作
- 需要版本控制的场景

---

## 关键问题：`db:push` 后能否使用 `db:migrate`？

### ❌ 直接使用会有问题

如果使用 `db:push` 创建了数据库，然后想使用 `db:migrate`：

1. **迁移历史表不存在或为空**
   - `__drizzle_migrations` 表可能不存在
   - 或者存在但没有记录

2. **迁移文件会尝试创建已存在的表**
   - 运行 `db:migrate` 时会报错：`table already exists`

3. **需要手动同步迁移历史**

---

## 解决方案

### 方案 1：统一使用 `db:push`（开发环境）

如果只是开发环境，可以一直使用 `db:push`：

```bash
# 每次修改 schema.ts 后
pnpm db:push
```

**优点：** 简单快速  
**缺点：** 无法追踪历史

---

### 方案 2：统一使用 `db:migrate`（推荐）

**首次设置：**

如果数据库已经通过 `db:push` 或 `init-db.js` 创建：

1. **生成迁移文件**（如果还没有）：
   ```bash
   pnpm db:generate
   ```

2. **手动标记迁移为已执行**：
   ```sql
   sqlite3 db.sqlite
   
   -- 创建迁移记录表
   CREATE TABLE IF NOT EXISTS __drizzle_migrations (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     hash TEXT NOT NULL,
     created_at INTEGER
   );
   
   -- 标记迁移为已执行（使用迁移文件名）
   INSERT INTO __drizzle_migrations (hash, created_at) 
   VALUES ('0000_chubby_vertigo', strftime('%s', 'now'));
   ```

3. **之后统一使用迁移系统**：
   ```bash
   # 修改 schema.ts
   pnpm db:generate  # 生成新的迁移文件
   pnpm db:migrate   # 执行迁移
   ```

---

### 方案 3：混合使用（不推荐）

**开发环境：** `db:push`  
**生产环境：** `db:migrate`

**问题：**
- 开发和生产环境可能不同步
- 容易出错

---

## 当前项目建议

### 现状分析

你的项目目前有：
- ✅ `init-db.js` - 手动创建表
- ✅ `db:push` - 直接同步
- ✅ `db:migrate` - 迁移系统
- ✅ 迁移文件已生成（`drizzle/0000_chubby_vertigo.sql`）

### 推荐方案

**选项 A：统一使用迁移系统（推荐）**

1. 删除或归档 `init-db.js`（不再使用）
2. 手动标记当前迁移为已执行
3. 之后统一使用 `db:generate` + `db:migrate`

**选项 B：开发环境使用 `db:push`**

1. 开发时使用 `db:push`
2. 生产环境使用 `db:migrate`（需要手动同步）

---

## 迁移历史表结构

```sql
CREATE TABLE __drizzle_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,        -- 迁移文件的哈希值/名称
  created_at INTEGER          -- 执行时间戳
);
```

---

## 最佳实践

### 开发环境
```bash
# 快速迭代
pnpm db:push
```

### 生产环境
```bash
# 版本控制
pnpm db:generate  # 生成迁移文件
pnpm db:migrate   # 执行迁移
```

### 团队协作
- ✅ 统一使用迁移系统
- ✅ 迁移文件提交到 Git
- ✅ 不要手动修改数据库结构

---

## 总结

**回答你的问题：**

> `db:push` 建立的 SQLite 是不是没法 migrate？

**答案：** 不是完全不能，但需要手动处理：

1. ✅ 可以 migrate，但需要先标记迁移为已执行
2. ⚠️ 如果直接 migrate 会报错（表已存在）
3. 💡 建议：统一使用一种方式，不要混用

**推荐做法：**
- 开发环境：使用 `db:push`（简单快速）
- 生产环境：使用 `db:migrate`（可追踪、可版本控制）
- 团队协作：统一使用 `db:migrate`

