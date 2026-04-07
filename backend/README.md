# GymApp Backend

Go 后端服务，使用 DDD 架构。

## 快速开始

### 1. 安装依赖

```bash
go mod download
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接。

### 3. 运行服务

```bash
go run cmd/server/main.go
```

服务将在 `http://localhost:8080` 启动。

### 4. 测试健康检查

```bash
curl http://localhost:8080/health
```

## 环境变量

### 开发环境（SQLite）

```bash
ENV=development
PORT=8080
DB_TYPE=sqlite
DB_PATH=./gymapp.db
```

### 生产环境（PostgreSQL）

```bash
ENV=production
PORT=8080
DB_TYPE=postgres
DATABASE_URL=postgres://user:password@localhost:5432/gymapp
```

## 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # 应用入口
├── internal/
│   ├── api/
│   │   └── handlers/        # HTTP 处理器
│   ├── application/         # 应用层（Use Cases）
│   ├── domain/              # 领域层
│   └── infrastructure/     # 基础设施层
│       ├── config/          # 配置管理
│       └── database/        # 数据库
├── .env.example             # 环境变量示例
├── go.mod                   # Go 模块定义
└── README.md                # 本文档
```

## 开发

### 运行开发服务器

```bash
go run cmd/server/main.go
```

### 构建

```bash
go build -o backend cmd/server/main.go
```

### 运行测试

```bash
go test ./...
```

## 数据库切换

通过环境变量 `DB_TYPE` 切换数据库：

- `sqlite` - SQLite（开发环境）
- `postgres` - PostgreSQL（生产环境）

代码完全通用，无需修改。

## 下一步

- [ ] 迁移 BodyPart 领域
- [ ] 迁移 Exercise 领域
- [ ] 迁移 Workout 领域
- [ ] 迁移认证和用户
