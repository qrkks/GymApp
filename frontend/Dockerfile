# ============================================
# 构建阶段
# ============================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# 安装构建时需要的系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
  && rm -rf /var/lib/apt/lists/*

# 启用 pnpm
RUN corepack enable pnpm

# 复制依赖文件（利用 Docker 缓存层）
COPY package.json pnpm-lock.yaml* ./

# 安装所有依赖（包括 devDependencies，构建时需要）
RUN pnpm install --frozen-lockfile

# 复制构建配置文件（在复制源码前，利用缓存）
COPY next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.js ./
COPY jsconfig.json ./

# 复制源码（构建时不需要环境变量，Next.js 会在运行时读取）
COPY . .
# 确保 public 目录存在（Next.js 需要，即使为空）
RUN mkdir -p public || true

# 设置构建时的虚拟环境变量（避免构建时检查失败）
# 这些值不会影响构建结果，只是避免报错
ENV AUTH_SECRET=build-time-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder
ENV NODE_ENV=production

# 构建应用（Next.js 构建不依赖运行时环境变量）
RUN pnpm run build

# 清理构建缓存和开发依赖
RUN pnpm store prune && \
    rm -rf .next/cache

# ============================================
# 运行时阶段
# ============================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# 安装运行时所需的最小系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# 启用 pnpm（用于运行数据库迁移脚本）
RUN corepack enable pnpm

# 创建非 root 用户
RUN groupadd --gid 1001 nodejs || true \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs || true

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# 从构建阶段复制必要的文件
# standalone 模式已经包含了所有必要的依赖和文件

# 复制 standalone 构建产物（包含所有运行时需要的文件）
# standalone 目录结构：包含 server.js、package.json、node_modules 等
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 复制 public 目录（构建阶段已确保存在）
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 复制运行时需要的配置和脚本（standalone 模式不包含这些）
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# 复制 package.json 和 pnpm-lock.yaml（用于安装 drizzle-kit）
COPY --from=builder /app/package.json ./package.json
# 复制 pnpm-lock.yaml（如果存在）- 使用 BuildKit mount 处理可选文件
USER root
RUN --mount=from=builder,source=/app,target=/tmp/builder \
    sh -c 'if [ -f /tmp/builder/pnpm-lock.yaml ]; then \
      cp /tmp/builder/pnpm-lock.yaml ./pnpm-lock.yaml; \
    elif ls /tmp/builder/pnpm-lock.yaml.* 1>/dev/null 2>&1; then \
      cp /tmp/builder/pnpm-lock.yaml.* ./; \
    fi' && \
    chown -R nextjs:nodejs ./pnpm-lock.yaml* 2>/dev/null || true

# 确保 drizzle-kit 在运行时可用（standalone 模式可能不包含命令行工具）
# 如果 standalone 的 node_modules 中没有 drizzle-kit，则安装它
USER root
RUN if [ ! -d "node_modules/drizzle-kit" ]; then \
      echo "📦 安装 drizzle-kit 到运行时环境..."; \
      pnpm add drizzle-kit@^0.30.6 --save-prod --frozen-lockfile || \
      pnpm install drizzle-kit@^0.30.6 --save-prod || true; \
      chown -R nextjs:nodejs node_modules package.json pnpm-lock.yaml* 2>/dev/null || true; \
    fi
USER nextjs

# 确保脚本可执行
RUN chmod +x ./scripts/start.sh || true

# 切换到非 root 用户
USER nextjs

EXPOSE 3000

# 移除健康检查，让容器自己启动
CMD ["./scripts/start.sh"]
