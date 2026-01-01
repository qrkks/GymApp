# 数据库脚本说明

## 当前可用脚本

### 数据库初始化

#### 方案 1: 使用 SQLite3 命令行工具（推荐）

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

#### 方案 2: 使用 Node.js 脚本

```bash
# 使用 better-sqlite3（需要编译工具）
npm run db:init

# 或使用替代方案（自动检测环境）
npm run db:init-alt
```

**注意**: better-sqlite3 需要：
- Visual Studio Build Tools (Windows)
- Python
- node-gyp

#### 方案 3: 手动创建数据库

参考 `create-db-manual.md` 文件，使用 GUI 工具或手动执行 SQL。

### 数据库重置

清空并重新初始化数据库（**警告：会删除所有数据**）：

```bash
npm run db:reset
```

## 已归档脚本

以下脚本已移至 `archive/` 目录，为一次性使用的脚本：

- `import-production-db.ts` - 生产数据迁移脚本（已使用）
- `reset-all-passwords.ts` - 批量密码重置脚本（已使用）

如需使用这些脚本，请从 `archive/` 目录中查找。

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
