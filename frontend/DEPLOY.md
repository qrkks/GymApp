# GymApp 部署配置

这个文档说明了 GymApp 前端应用的部署配置和使用方法。

## 文件结构

```
frontend/
├── .env              # 环境变量配置文件（服务器上手动创建）
├── .env.example      # 环境变量模板文件（Git 中）
├── docker-compose.yml    # Docker Compose 配置文件
├── Dockerfile           # Docker 镜像构建文件
└── DEPLOY.md           # 本文档
```

## 使用方法

### 1. 服务器部署（GitHub Actions 自动执行）

GitHub Actions 会自动：
1. 构建 Docker 镜像
2. 复制 `docker-compose.yml` 到服务器
3. 加载 Docker 镜像
4. 启动服务

### 2. 本地测试

```bash
# 进入 frontend 目录
cd frontend

# 启动服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 3. 手动部署到服务器

如果需要手动部署：

```bash
# 复制文件到服务器
scp docker-compose.yml user@server:/path/to/app/frontend/

# 在服务器上执行
cd /path/to/app/frontend
docker compose up -d
```

## 环境变量配置

### .env 文件位置

`.env` 文件应放在 `frontend/` 根目录下（与 `docker-compose.yml` 同级）：

```
frontend/
├── .env              # 环境变量配置文件（服务器上手动创建）
├── .env.example      # 环境变量模板文件（Git 中）
└── docker-compose.yml
```

### 首次部署设置

1. **复制模板文件**：
   ```bash
   cd /home/{USER}/gymapp/frontend
   cp .env.example .env
   ```

2. **编辑 .env 文件**，填入真实值：
   ```bash
   nano .env
   ```

3. **设置文件权限**：
   ```bash
   chmod 600 .env
   ```

### 必需的环境变量

在 `docker-compose.yml` 中使用的环境变量（需要在 `.env` 文件中配置）：

- `AUTH_SECRET`: NextAuth 认证密钥（必需）
- `POSTGRES_PASSWORD`: PostgreSQL 数据库密码（必需）
- `NEXTAUTH_URL`: 应用 URL，格式：`https://yourdomain.com`（必需）
- `DOMAIN_NAME`: 域名（用于 Traefik），格式：`yourdomain.com`（必需）

**注意**: 
- 自 PostgreSQL 迁移后，不再使用 `DATABASE_PATH` 环境变量
- `DATABASE_URL` 会在 `docker-compose.yml` 中自动构建，无需在 `.env` 中单独配置

## 服务管理

### 常用命令

```bash
# 进入 frontend 目录
cd frontend

# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看状态
docker compose ps

# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f gymapp
docker compose logs -f postgres

# 查看服务资源使用情况
docker compose top
```

### 数据库备份

```bash
# 创建备份目录
mkdir -p backups

# 备份 PostgreSQL 数据库
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres -d gymapp > backups/backup_${TIMESTAMP}.sql

# 压缩备份文件
gzip backups/backup_${TIMESTAMP}.sql

# 查看备份文件
ls -lh backups/
```

## 故障排除

### 服务无法启动

```bash
# 检查日志
docker compose logs

# 检查环境变量（从 .env 文件加载）
docker compose exec gymapp env | grep -E "(AUTH_SECRET|NEXTAUTH_URL|DATABASE_URL|DOMAIN_NAME)"

# 检查数据库连接
docker compose exec postgres pg_isready -U postgres

# 检查 PostgreSQL 日志
docker compose logs postgres

# 检查容器状态
docker compose ps -a
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

### 移动设备登录后无法访问受保护路由

**症状**：在手机上登录后，访问受保护的路由（如 `/workouts`）时被重定向回登录页，但电脑登录正常。

**原因**：移动浏览器（特别是 iOS Safari）对 Cookie 的 `sameSite` 策略处理更严格。

**解决方案**：

1. **确保环境变量正确设置**：
   ```bash
   # 检查 NEXTAUTH_URL 是否正确设置
   docker compose exec gymapp env | grep NEXTAUTH_URL
   
   # 应该显示完整的 HTTPS URL，例如：
   # NEXTAUTH_URL=https://yourdomain.com
   ```

2. **确保使用 HTTPS**：
   - 生产环境必须使用 HTTPS（通过 Traefik）
   - Cookie 配置已自动设置为 `sameSite: 'none'` 和 `secure: true`（生产环境）

3. **检查 Cookie 设置**：
   - 应用已配置为在生产环境使用 `sameSite: 'none'` 配合 `secure: true`
   - 这需要 HTTPS 支持，确保 Traefik 正确配置了 SSL 证书

4. **查看日志**：
   ```bash
   # 查看应用日志，查找认证相关的警告
   docker compose logs gymapp | grep -i "middleware\|auth\|token"
   
   # 查看是否有移动设备相关的日志
   docker compose logs gymapp | grep -i "mobile\|未找到 token"
   ```

5. **清除浏览器缓存和 Cookie**：
   - 在移动设备上清除网站的所有 Cookie 和缓存
   - 重新登录测试

**技术细节**：
- 生产环境 Cookie 配置：`sameSite: 'none'`, `secure: true`
- 开发环境 Cookie 配置：`sameSite: 'lax'`, `secure: false`
- 此配置在 `frontend/lib/auth-config.ts` 中已自动处理

## 注意事项

1. **权限**: 确保部署用户有 Docker 权限
2. **网络**: Traefik 网络需要预先创建
3. **备份**: 定期备份数据库（参考上面的数据库备份命令）
4. **监控**: 关注服务日志和健康检查
5. **.env 文件**: 不要将 `.env` 文件提交到 Git，确保文件权限为 600
6. **环境变量**: 所有环境变量都在 `.env` 文件中，docker compose 会自动加载

## 相关文档

- [`../docs/部署指南.md`](../docs/部署指南.md) - 完整部署指南
- [`../docs/Git-Action配置指南.md`](../docs/Git-Action配置指南.md) - CI/CD 配置

