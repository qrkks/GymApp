# 故障排除指南

## better-sqlite3 原生绑定问题

如果遇到 `Could not locate the bindings file` 错误，请尝试以下解决方案：

### 方案 1: 重新安装 better-sqlite3

```bash
# 删除 node_modules 和锁文件
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 重新安装
npm install

# 如果还是不行，尝试强制重新构建
npm rebuild better-sqlite3 --build-from-source
```

### 方案 2: 使用预编译版本

```bash
npm install better-sqlite3 --build-from-source=false
```

### 方案 3: 使用 SQLite 命令行工具手动创建数据库

如果 better-sqlite3 无法编译，可以暂时使用 SQLite 命令行工具：

```bash
# 安装 SQLite 命令行工具（如果还没有）
# Windows: 下载 https://www.sqlite.org/download.html
# 或使用 Chocolatey: choco install sqlite

# 创建数据库
sqlite3 db.sqlite < scripts/init-db.sql
```

### 方案 4: 使用其他 SQLite 库（临时方案）

如果以上都不行，可以考虑暂时使用 `sql.js`（纯 JavaScript 实现，但性能较低）：

```bash
npm install sql.js
```

然后修改 `lib/db/index.ts` 使用 sql.js。

### 方案 5: 等待编译完成

有时编译过程需要时间，确保：
- 没有其他进程锁定文件
- 关闭所有可能使用数据库的进程
- 以管理员权限运行（Windows）

## 当前状态

- ✅ 所有 API Routes 已创建
- ✅ Schema 定义完成
- ⚠️ 数据库初始化需要 better-sqlite3 正确编译

## 临时解决方案

在解决 better-sqlite3 问题之前，你可以：

1. **先测试 API 结构**：即使数据库未初始化，也可以检查 API routes 的代码是否正确
2. **使用现有 Django 数据库**：暂时继续使用 Django 后端，新 API 作为备用
3. **手动创建数据库**：使用 SQLite 命令行工具手动执行 `scripts/init-db.sql`

## 下一步

一旦 better-sqlite3 问题解决：

1. 运行 `npm run db:init` 初始化数据库
2. 配置 `.env.local` 文件（设置 NEXTAUTH_SECRET 等）
3. 运行 `npm run dev` 启动开发服务器
4. 测试 API endpoints

