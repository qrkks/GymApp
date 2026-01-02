# Git Action 配置指南

## 必需的 Secrets 配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中配置以下 secrets：

### 服务器连接信息
```
SERVER_IP        # 服务器IP地址 (例如: 39.107.126.13)
SERVER_USER      # 服务器用户名 (例如: root 或 ubuntu)
SERVER_PASSWORD  # 服务器SSH密码
PROJECT_PATH     # 项目在服务器上的绝对路径 (可选, 默认自动查找)
```

### 应用配置
```
AUTH_SECRET      # NextAuth认证密钥 (生成命令: openssl rand -base64 32)
DATABASE_PATH    # 数据库文件路径 (例如: /app/db/production.sqlite3)
NEXTAUTH_URL     # 生产环境URL (例如: https://yourdomain.com)
DOMAIN_NAME      # 域名 (例如: yourdomain.com)
```

## 配置步骤

### 1. 生成 AUTH_SECRET

```bash
# 在本地生成认证密钥
openssl rand -base64 32

# 示例输出: abcdefghijklmnopqrstuvwxyz1234567890ABCD
```

### 2. 配置 NEXTAUTH_URL 和 DOMAIN_NAME

#### 如果有域名：
```
NEXTAUTH_URL=https://yourdomain.com
DOMAIN_NAME=yourdomain.com
```

#### 如果只有IP地址（使用自签名证书）：
```
NEXTAUTH_URL=https://39.107.126.13
DOMAIN_NAME=39.107.126.13
```

**注意**：使用HTTPS访问，需要确保服务器上有有效的SSL证书（自签名或Let's Encrypt）。如果使用自签名证书，浏览器会显示安全警告。

### 3. 在 GitHub 中配置 Secrets

1. 进入仓库 **Settings** 标签
2. 点击左侧 **Secrets and variables** > **Actions**
3. 点击 **New repository secret**
4. 逐个添加上述所有 secrets

## 验证配置

### 检查 Secrets 是否正确配置

Git Action 运行时会自动使用这些 secrets。如果配置错误，会看到以下错误：

- **SSH 连接失败**: 检查 `SERVER_IP`, `SERVER_USER`, `SERVER_PASSWORD`
- **构建失败**: 检查 `AUTH_SECRET`, `DATABASE_PATH`, `NEXTAUTH_URL`
- **Traefik 配置失败**: 检查 `DOMAIN_NAME`

### 测试部署

推送代码到 `main` 分支将自动触发部署：

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## 故障排除

### 常见问题

#### 1. SSH 连接超时
```
Error: ssh: connect to host xxx.xxx.xxx.xxx port 22: Connection timed out
```
**解决方案**:
- 检查服务器IP地址是否正确
- 确认服务器防火墙允许22端口访问
- 验证用户名和密码

#### 2. Docker 构建失败
```
Error: buildx failed with: ERROR: failed to solve: process "/bin/sh -c pnpm install" did not complete successfully
```
**解决方案**:
- 检查 `AUTH_SECRET` 是否为有效的base64字符串
- 确认 `NEXTAUTH_URL` 是完整的URL格式

#### 3. 容器启动失败
```
Frontend container failed to start
```
**解决方案**:
- 检查 `DATABASE_PATH` 是否正确
- 查看容器日志: `docker logs gymapp-frontend`

### 调试技巧

#### 查看部署日志
```bash
# 在 Actions 标签页查看详细日志
# 或者通过SSH连接到服务器查看
ssh user@server-ip
docker logs gymapp-frontend
```

#### 手动测试配置
```bash
# 在本地测试Docker构建
cd frontend
docker build \
  --build-arg AUTH_SECRET="test-secret" \
  --build-arg DATABASE_PATH="/app/db/test.sqlite3" \
  --build-arg NEXTAUTH_URL="https://test.com" \
  -t gymapp-test .
```

## 安全注意事项

1. **不要在代码中硬编码敏感信息**
2. **定期轮换 AUTH_SECRET**
3. **使用强密码作为服务器SSH密码**
4. **限制 GitHub Actions 的权限范围**
5. **定期检查并更新 secrets**

## 环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `SERVER_IP` | 是 | 服务器公网IP | `39.107.126.13` |
| `SERVER_USER` | 是 | SSH用户名 | `ubuntu` |
| `SERVER_PASSWORD` | 是 | SSH密码 | `********` |
| `PROJECT_PATH` | 否 | 项目绝对路径 | `/home/ubuntu/gymapp` |
| `AUTH_SECRET` | 是 | NextAuth密钥 | `base64字符串` |
| `DATABASE_PATH` | 是 | 数据库路径 | `/app/db/prod.sqlite3` |
| `NEXTAUTH_URL` | 是 | 应用URL | `https://app.com` |
| `DOMAIN_NAME` | 是 | 域名 | `app.com` |

---

**最后更新：** 2026年1月2日
