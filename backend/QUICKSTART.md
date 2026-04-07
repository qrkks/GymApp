# 快速启动指南

## 阶段 0：基础设施搭建 ✅

### 1. 安装 Go

确保已安装 Go 1.21 或更高版本：

```bash
go version
```

### 2. 安装依赖

```bash
cd backend
go mod download
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

编辑 `.env` 文件，配置数据库：

**开发环境（SQLite）**：
```env
ENV=development
PORT=8080
DB_TYPE=sqlite
DB_PATH=./gymapp.db
```

**生产环境（PostgreSQL）**：
```env
ENV=production
PORT=8080
DB_TYPE=postgres
DATABASE_URL=postgres://user:password@localhost:5432/gymapp
```

### 4. 运行服务

```bash
go run cmd/server/main.go
```

或者使用 Makefile：

```bash
make run
```

### 5. 测试健康检查

打开新终端：

```bash
# Windows PowerShell
curl http://localhost:8080/health

# 或者使用浏览器访问
# http://localhost:8080/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "GymApp Backend is running"
}
```

## 验证清单

- [ ] Go 环境正常（`go version`）
- [ ] 依赖安装完成（`go mod download`）
- [ ] 环境变量配置完成（`.env` 文件）
- [ ] 服务可以启动（`go run cmd/server/main.go`）
- [ ] 健康检查返回 200（`curl http://localhost:8080/health`）
- [ ] 日志正常输出

## 下一步

完成阶段 0 后，可以开始：
- [ ] 阶段 1：迁移 BodyPart 领域

## 常见问题

### 问题：找不到 .env 文件

**解决**：确保在 `backend/` 目录下创建 `.env` 文件，或使用环境变量。

### 问题：数据库连接失败

**SQLite**：
- 确保 `DB_PATH` 路径正确
- 确保有写入权限

**PostgreSQL**：
- 确保 PostgreSQL 服务运行
- 检查连接字符串格式
- 检查用户名和密码

### 问题：端口被占用

**解决**：修改 `.env` 中的 `PORT` 值，或关闭占用端口的程序。
