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
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 复制运行时需要的配置和脚本（standalone 模式不包含这些）
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# 确保脚本可执行
RUN chmod +x ./scripts/start.sh || true

# 切换到非 root 用户
USER nextjs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["./scripts/start.sh"]
