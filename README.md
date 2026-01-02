# GymApp

## 环境要求

### Node.js 版本

本项目要求 **Node.js 22.x**（具体版本：22.21.1）。

#### 使用 Volta（可选，仅本地开发）

项目已配置 [Volta](https://volta.sh/) 进行版本管理。如果你安装了 Volta，它会自动使用 package.json 中指定的 Node 版本。

```bash
# 安装 Volta（可选，仅用于本地开发）
# Windows: https://docs.volta.sh/guide/getting-started

# 进入项目目录后，Volta 会自动使用 package.json 中指定的版本
cd frontend
pnpm install
```

**注意**：生产环境不需要 Volta，所有脚本都直接使用系统安装的 Node.js。

#### 使用 nvm

如果使用 nvm，项目根目录已包含 `.nvmrc` 文件：

```bash
cd frontend
nvm use
# 或
nvm install
```

#### 手动安装

确保安装 Node.js 22.21.1 或兼容的 22.x 版本。

### 包管理器

项目使用 **pnpm**（版本 >= 8.0.0，推荐 10.24.0）。

```bash
# 安装 pnpm（如果尚未安装）
npm install -g pnpm
# 或使用 corepack（Node.js 16.10+）
corepack enable
```

## 项目结构

- `frontend/` - Next.js 全栈应用（包含前端和 API 路由）

## 快速开始

### 开发

```bash
cd frontend
pnpm install
pnpm dev
```

应用将在 `http://localhost:3000` 启动，API 路由位于 `/api/*`。

## 部署

### 快速开始

1. **配置环境变量**
   ```bash
   cp env.example.txt .env
   # 编辑 .env 文件，设置必需的环境变量
   ```

2. **启动应用**
   ```bash
   docker-compose up -d
   ```

3. **初始化数据库**
   ```bash
   docker-compose exec gymapp pnpm run db:init
   ```

### 详细部署指南

请参考以下文档：
- [`docs/部署前检查清单.md`](docs/部署前检查清单.md) - 部署前准备工作
- [`docs/部署指南.md`](docs/部署指南.md) - 详细部署说明
- [`docs/Git-Action配置指南.md`](docs/Git-Action配置指南.md) - CI/CD配置指南

## 版本管理说明

- **package.json**: 包含 `engines` 字段指定 Node 版本要求
- **env.example.txt**: 环境变量配置模板
- **docker-compose.yml**: Docker Compose 配置
- **Dockerfile**: 使用 Node 22 Alpine 镜像
- **volta 配置**: 仅用于本地开发（可选），生产环境不需要

所有脚本都直接使用系统安装的 Node.js，确保生产环境兼容性。