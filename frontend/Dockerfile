FROM node:22-bookworm-slim AS builder

WORKDIR /app

# 安装构建时需要的系统依赖 (PostgreSQL迁移后简化)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 curl \
  && rm -rf /var/lib/apt/lists/*

# 启用 pnpm
RUN corepack enable pnpm

# 复制依赖文件以利用缓存
COPY package.json pnpm-lock.yaml* ./

# 安装依赖 (PostgreSQL驱动无需原生编译)
RUN pnpm install --frozen-lockfile && \
    echo "✅ PostgreSQL依赖安装完成" && \
    pnpm store prune

# 复制源码并构建
COPY . .
RUN mkdir -p public && pnpm run build

# 确保构建产物存在
RUN ls -la .next || true

FROM node:22-bookworm-slim AS runner

WORKDIR /app

# 运行时所需最小系统依赖 (PostgreSQL迁移后)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client curl \
  && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户与组
RUN groupadd --gid 1001 nodejs || true \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs || true

# 复制构建产物与必要文件到最终镜像（不包含 secrets）
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# 设置应用权限 (PostgreSQL无需本地数据库目录)
RUN chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

CMD ["bash", "./scripts/start.sh"]
