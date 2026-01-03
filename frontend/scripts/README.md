# 部署脚本说明

## start.sh

应用启动脚本，负责：
1. 等待 PostgreSQL 连接
2. 运行数据库迁移
3. 启动 Next.js 应用服务器

## wait-for-health.sh

健康检查等待脚本，用于 CI/CD 部署时等待应用完全启动。

### 使用方法

```bash
# 基本用法（使用默认参数）
./scripts/wait-for-health.sh

# 指定健康检查 URL
./scripts/wait-for-health.sh http://localhost:3000/api/health

# 指定所有参数
./scripts/wait-for-health.sh http://localhost:3000/api/health 30 3
```

### 参数说明

- `$1`: 健康检查 URL（默认: `http://localhost:3000/api/health`）
- `$2`: 最大尝试次数（默认: `30`）
- `$3`: 每次尝试之间的等待时间（秒，默认: `3`）

### 在 CI/CD 中使用

在 GitHub Actions 或其他 CI/CD 脚本中，可以在启动容器后使用此脚本：

```bash
# 启动容器
docker compose up -d

# 等待应用健康（最多等待 90 秒）
./scripts/wait-for-health.sh http://localhost:3000/api/health 30 3

# 或者从服务器外部检查（如果端口已映射）
./scripts/wait-for-health.sh http://your-server-ip:3000/api/health 30 3
```

### 退出码

- `0`: 健康检查成功
- `1`: 健康检查失败（超时或应用未响应）
