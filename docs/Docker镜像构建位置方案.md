# Docker 镜像构建位置方案

## 🎯 问题

Docker 镜像应该在哪个步骤、哪里创建？不同的位置有不同的优缺点。

## 📊 当前方案分析

### 当前流程

```
GitHub Actions Runner (Ubuntu)
  ↓
1. 构建 Docker 镜像
  ↓
2. 保存为 tar 文件
  ↓
3. 通过 SCP 传输到服务器
  ↓
4. 在服务器上加载镜像
  ↓
5. 使用 docker compose 启动
```

**优点**：
- ✅ 利用 GitHub Actions 的构建缓存
- ✅ 服务器不需要构建环境
- ✅ 构建和部署分离

**缺点**：
- ⚠️ 需要传输大文件（镜像 tar）
- ⚠️ 网络传输可能较慢
- ⚠️ 如果服务器在国内，GitHub Actions 在国外，传输可能很慢

---

## 🔍 方案对比

### 方案 1：GitHub Actions 构建 + SCP 传输（当前方案）

**流程**：
```
GitHub Actions → 构建镜像 → tar 文件 → SCP → 服务器 → docker load
```

**优点**：
- ✅ 利用 GitHub Actions 的构建缓存（GitHub Actions Cache）
- ✅ 服务器不需要 Node.js、pnpm 等构建工具
- ✅ 构建环境统一（GitHub 的 Ubuntu runner）
- ✅ 构建和部署分离，职责清晰
- ✅ 可以利用 GitHub Actions 的并行构建能力

**缺点**：
- ❌ 需要传输大文件（镜像可能几百 MB 到几 GB）
- ❌ 网络传输可能较慢（特别是服务器在国内）
- ❌ 如果传输失败，需要重新构建和传输
- ❌ 占用服务器磁盘空间（临时 tar 文件）

**适用场景**：
- ✅ 服务器资源有限（不想在服务器上构建）
- ✅ 需要利用 GitHub Actions 的缓存
- ✅ 构建环境需要特定工具（当前项目需要 Node.js 22, pnpm）
- ✅ 服务器网络稳定，可以接受传输时间

---

### 方案 2：服务器上直接构建

**流程**：
```
GitHub Actions → 推送代码到服务器 → 服务器上构建镜像 → docker compose up
```

**实现方式**：
```yaml
# GitHub Actions 中
- name: Transfer code to server
  run: |
    sshpass -p "${{ secrets.SERVER_PASSWORD }}" scp -r frontend ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }}:~/gymapp/

- name: Build on server
  run: |
    sshpass -p "${{ secrets.SERVER_PASSWORD }}" ssh ... << 'EOF'
      cd ~/gymapp/frontend
      docker build -t gymapp-frontend:latest .
      cd deploy
      docker compose up -d
    EOF
```

**优点**：
- ✅ 不需要传输大文件
- ✅ 构建在服务器本地，速度快
- ✅ 不需要临时存储空间
- ✅ 适合服务器在国内的场景

**缺点**：
- ❌ 服务器需要安装构建工具（Node.js 22, pnpm）
- ❌ 占用服务器资源（CPU、内存、磁盘）
- ❌ 构建时间占用服务器资源
- ❌ 如果构建失败，可能影响服务器性能
- ❌ 需要管理服务器上的构建环境
- ❌ 无法利用 GitHub Actions 的缓存

**适用场景**：
- ✅ 服务器资源充足
- ✅ 服务器在国内，GitHub Actions 在国外（传输慢）
- ✅ 可以接受在服务器上安装构建工具
- ✅ 构建时间不是问题

---

### 方案 3：使用 Docker Registry（Docker Hub / GitHub Container Registry）

**流程**：
```
GitHub Actions → 构建镜像 → 推送到 Registry → 服务器拉取镜像 → docker compose up
```

**实现方式**：
```yaml
# GitHub Actions 中
- name: Build and push to registry
  uses: docker/build-push-action@v5
  with:
    context: ./frontend
    push: true
    tags: |
      ghcr.io/username/gymapp-frontend:latest
      ghcr.io/username/gymapp-frontend:${{ github.sha }}

# 服务器上
# docker-compose.yml
services:
  gymapp:
    image: ghcr.io/username/gymapp-frontend:latest
    pull_policy: always
```

**优点**：
- ✅ 镜像版本管理（可以回滚到特定版本）
- ✅ 多服务器可以共享镜像
- ✅ 不需要传输大文件（服务器直接拉取）
- ✅ 可以利用 Registry 的 CDN 加速
- ✅ 符合 Docker 最佳实践
- ✅ 可以设置镜像标签（latest, v1.0.0, commit-sha）

**缺点**：
- ⚠️ 需要配置 Registry 认证（GitHub Container Registry 需要 token）
- ⚠️ 首次拉取可能较慢（但后续有缓存）
- ⚠️ 如果 Registry 不可用，无法部署
- ⚠️ 公开 Registry 可能暴露代码结构（私有需要付费或使用 GitHub）

**适用场景**：
- ✅ 多服务器部署
- ✅ 需要版本管理和回滚
- ✅ 符合 Docker 最佳实践
- ✅ 可以接受 Registry 的配置复杂度

---

### 方案 4：混合方案（构建缓存 + Registry）

**流程**：
```
GitHub Actions → 构建镜像 → 推送到 Registry → 服务器拉取
同时：保留 tar 文件作为备份
```

**优点**：
- ✅ 结合方案 1 和 3 的优点
- ✅ 有 Registry 作为主要方式
- ✅ 有 tar 文件作为备用

**缺点**：
- ⚠️ 增加复杂度
- ⚠️ 需要维护两套流程

---

## 📊 方案对比表

| 方案 | 构建位置 | 传输方式 | 复杂度 | 速度 | 资源占用 | 版本管理 | 推荐度 |
|------|----------|----------|--------|------|----------|----------|--------|
| 1. GitHub Actions + SCP | GitHub | SCP 传输 tar | ⭐⭐ | ⭐⭐⭐ | 服务器低 | ❌ | ⭐⭐⭐⭐ |
| 2. 服务器构建 | 服务器 | 代码传输 | ⭐⭐ | ⭐⭐⭐⭐ | 服务器高 | ❌ | ⭐⭐⭐ |
| 3. Docker Registry | GitHub | Registry 拉取 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 服务器低 | ✅ | ⭐⭐⭐⭐⭐ |
| 4. 混合方案 | GitHub | Registry + SCP | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 服务器低 | ✅ | ⭐⭐⭐ |

---

## 🎯 推荐方案分析

### 基于当前项目情况

**当前项目特点**：
- 单服务器部署
- **服务器在国内** ⚠️
- 使用 Next.js（构建需要 Node.js 22, pnpm）
- 镜像大小：估计 200-500 MB

### ✅ 最终决定：方案 1（GitHub Actions 构建 + SCP 传输）

**决策理由**：
- ✅ 服务器在国内，无法稳定拉取 Docker Registry 镜像
- ✅ GitHub Actions 构建环境稳定，不受国内网络限制
- ✅ SCP 传输虽然慢，但稳定可靠
- ✅ 不需要在服务器上安装构建工具
- ✅ 适合当前单服务器部署场景

**注意事项**：
- ⚠️ 传输大文件可能较慢，但可以接受
- ⚠️ 可以优化传输速度（压缩、rsync）
- ⚠️ 如果未来服务器在国外，可以考虑迁移到 Registry

**优化建议**（可选）：
1. **压缩镜像**：使用 gzip 压缩 tar 文件
   ```yaml
   docker save gymapp-frontend:latest | gzip > gymapp-image.tar.gz
   ```
2. **使用 rsync**：支持断点续传，传输失败可继续
   ```yaml
   rsync -avz --progress gymapp-image.tar.gz user@server:~/
   ```
3. **传输后立即清理**：加载后删除 tar 文件，节省空间
   ```bash
   docker load < ~/gymapp-image.tar && rm ~/gymapp-image.tar
   ```

### 备选：方案 3（Docker Registry）- 长期最佳实践（暂不采用）

**理由**：
1. ✅ **符合 Docker 最佳实践**
   - 使用 Registry 是标准做法
   - 镜像版本管理
   - 可以回滚到特定版本

2. ✅ **性能优势**
   - 服务器直接拉取，不需要传输大文件
   - Registry 通常有 CDN 加速
   - 可以利用 Docker 层缓存

3. ✅ **可扩展性**
   - 如果未来需要多服务器，可以直接使用
   - 可以设置多个标签（latest, v1.0.0, commit-sha）

4. ✅ **可靠性**
   - 镜像存储在 Registry，不会丢失
   - 可以重新拉取

**实施要点**：
- 使用 GitHub Container Registry（免费，私有）
- 配置 GitHub Actions 推送镜像
- 配置服务器拉取镜像（需要认证 token）
- 更新 docker-compose.yml 使用 Registry 镜像

### 备选：方案 1（当前方案）- 如果 Registry 配置复杂

**如果不想配置 Registry**：
- 当前方案已经工作良好
- 可以优化传输速度（压缩、断点续传）
- 适合单服务器、简单场景

---

## 💡 具体实施建议

### 如果选择方案 3（Docker Registry）

**步骤 1：配置 GitHub Container Registry**

```yaml
# .github/workflows/deploy.yml
- name: Build and push to GHCR
  uses: docker/build-push-action@v5
  with:
    context: ./frontend
    push: true
    tags: |
      ghcr.io/${{ github.repository_owner }}/gymapp-frontend:latest
      ghcr.io/${{ github.repository_owner }}/gymapp-frontend:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max

- name: Deploy to server
  run: |
    sshpass -p "${{ secrets.SERVER_PASSWORD }}" ssh ... << 'EOF'
      # 登录到 GitHub Container Registry
      echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
      
      # 拉取最新镜像
      docker pull ghcr.io/${{ github.repository_owner }}/gymapp-frontend:latest
      
      # 更新 docker-compose.yml 使用 Registry 镜像
      cd /home/{USER}/gymapp/frontend/deploy
      docker compose up -d
    EOF
```

**步骤 2：更新 docker-compose.yml**

```yaml
services:
  gymapp:
    image: ghcr.io/username/gymapp-frontend:latest
    pull_policy: always  # 每次部署拉取最新
    # 或者
    # image: ghcr.io/username/gymapp-frontend:${IMAGE_TAG:-latest}
```

**步骤 3：配置服务器认证**

```bash
# 在服务器上创建 GitHub Personal Access Token
# 设置环境变量或使用 docker login
echo $GITHUB_TOKEN | docker login ghcr.io -u username --password-stdin
```

---

### 如果保持方案 1（当前方案）- 优化建议

**优化传输速度**：
```yaml
# 压缩镜像（如果支持）
docker save gymapp-frontend:latest | gzip > gymapp-image.tar.gz

# 使用 rsync 代替 scp（支持断点续传）
rsync -avz --progress gymapp-image.tar.gz user@server:~/
```

**优化存储**：
```yaml
# 传输后立即加载并删除 tar
docker load < ~/gymapp-image.tar && rm ~/gymapp-image.tar
```

---

## 🤔 讨论要点

1. **你的服务器位置**？
   - 国内还是国外？
   - 如果国内，GitHub Actions 传输可能较慢

2. **服务器资源**？
   - CPU、内存是否充足？
   - 是否可以在服务器上构建？

3. **未来规划**？
   - 是否需要多服务器部署？
   - 是否需要版本管理和回滚？

4. **复杂度接受度**？
   - 是否可以接受配置 Registry？
   - 还是希望保持简单？

---

## 🎯 我的建议

**短期（当前）**：
- 如果当前方案工作良好，可以保持
- 优化传输速度（压缩、rsync）

**长期（推荐）**：
- 迁移到 Docker Registry（方案 3）
- 更符合最佳实践
- 为未来扩展做准备

**你的选择**：
1. 保持当前方案（方案 1），优化传输
2. 迁移到 Docker Registry（方案 3）
3. 在服务器上构建（方案 2）
4. 其他想法？

