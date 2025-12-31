# 数据库初始化脚本

## 问题

`better-sqlite3` 需要原生绑定（native bindings），在 Windows 上可能需要编译工具。

## 解决方案

### 方案 1: 使用 SQLite3 命令行工具（推荐）

如果你已经安装了 SQLite3 命令行工具：

```bash
# Windows
sqlite3 db.sqlite < scripts/init-db.sql

# 或使用 npm 脚本
npm run db:init-sqlite3
```

**安装 SQLite3:**
- Windows: 从 https://www.sqlite.org/download.html 下载
- 或使用 Chocolatey: `choco install sqlite`
- 或使用 Scoop: `scoop install sqlite`

### 方案 2: 重新编译 better-sqlite3

```bash
# 删除 node_modules 中的 better-sqlite3
npm uninstall better-sqlite3
npm install better-sqlite3

# 或强制重新构建
npm rebuild better-sqlite3 --build-from-source
```

**注意**: 这需要：
- Visual Studio Build Tools (Windows)
- Python
- node-gyp

### 方案 3: 使用替代初始化脚本

```bash
npm run db:init-alt
```

这个脚本会尝试使用 better-sqlite3，如果失败会给出清晰的错误信息。

### 方案 4: 手动创建数据库

1. 打开 SQLite 命令行或 GUI 工具（如 DB Browser for SQLite）
2. 创建新数据库 `db.sqlite`
3. 执行 `scripts/init-db.sql` 中的所有 SQL 语句

## 验证数据库

创建成功后，你可以使用 SQLite 工具验证：

```bash
sqlite3 db.sqlite
.tables
.schema
```

应该看到以下表：
- users
- body_parts
- exercises
- workouts
- workout_body_parts
- workout_sets
- sets

