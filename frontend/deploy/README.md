# Frontend 部署配置

这个目录包含了 GymApp 前端应用的部署相关文件。

## 文件结构

```
frontend/deploy/
├── docker-compose.yml    # Docker Compose 配置文件
├── deploy.sh            # 部署管理脚本
└── README.md           # 本文档
```

## 使用方法

### 1. 服务器部署（GitHub Actions 自动执行）

GitHub Actions 会自动：
1. 复制 `docker-compose.yml` 到服务器
2. 加载 Docker 镜像
3. 启动服务

### 2. 本地测试

```bash
# 进入部署目录
cd frontend/deploy

# 启动服务
./deploy.sh start

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs

# 停止服务
./deploy.sh stop
```

### 3. 手动部署到服务器

如果需要手动部署：

```bash
# 复制文件到服务器
scp docker-compose.yml user@server:/path/to/app/deploy/
scp deploy.sh user@server:/path/to/app/deploy/

# 在服务器上执行
cd /path/to/app/deploy
./deploy.sh start
```

## 环境变量

在 `docker-compose.yml` 中使用的环境变量：

- `AUTH_SECRET`: NextAuth 认证密钥
- `POSTGRES_PASSWORD`: PostgreSQL 数据库密码
- `NEXTAUTH_URL`: 应用 URL
- `DOMAIN_NAME`: 域名（用于 Traefik）

**注意**: 自 PostgreSQL 迁移后，不再使用 `DATABASE_PATH` 环境变量。

## 服务管理

### 常用命令

```bash
# 启动服务
./deploy.sh start

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs

# 备份数据库 (PostgreSQL pg_dump)
./deploy.sh backup
```

### 直接使用 Docker Compose

```bash
# 进入部署目录
cd frontend/deploy

# 启动
docker compose up -d

# 停止
docker compose down

# 查看日志
docker compose logs -f gymapp
```

## 故障排除

### 服务无法启动

```bash
# 检查日志
./deploy.sh logs

# 检查环境变量
docker compose exec gymapp env

# 检查数据库连接
docker compose exec postgres pg_isready -U postgres

# 检查 PostgreSQL 日志
docker compose logs postgres
```

### 端口冲突

```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"  # 改为其他端口
```

### Traefik 配置问题

```bash
# 检查 Traefik 日志
docker logs traefik

# 验证域名解析
nslookup yourdomain.com
```

## 注意事项

1. **权限**: 确保部署用户有 Docker 权限
2. **网络**: Traefik 网络需要预先创建
3. **备份**: 定期运行 `./deploy.sh backup`
4. **监控**: 关注服务日志和健康检查

## 相关文档

- [`../../docs/部署指南.md`](../../docs/部署指南.md) - 完整部署指南
- [`../../docs/Git-Action配置指南.md`](../../docs/Git-Action配置指南.md) - CI/CD 配置
