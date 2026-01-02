# ======================== 优化构建策略 ========================
FROM node:22-bookworm-slim

ARG AUTH_SECRET
ARG DATABASE_PATH
ARG NEXTAUTH_URL

ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_PATH=${DATABASE_PATH}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV AUTH_TRUST_HOST=true
ENV NODE_ENV=production

WORKDIR /app

# 1. 首先安装系统依赖（构建阶段需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ sqlite3 curl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# 2. 启用 pnpm
RUN corepack enable pnpm

# 3. 复制依赖文件（利用Docker层缓存）
COPY package.json pnpm-lock.yaml* ./

# 4. 安装所有依赖
RUN pnpm install --frozen-lockfile && \
    echo "🔧 重建 better-sqlite3..." && \
    pnpm rebuild better-sqlite3 --config.build_from_source=true && \
    echo "✅ better-sqlite3 重建完成"

# 5. 复制源码（在依赖之后，源码变化不会影响依赖安装缓存）
COPY . .

# 6. 构建应用
RUN pnpm run build

# 7. 切换到非root用户
USER nextjs

# 8. 创建数据库目录
RUN mkdir -p db

# 9. 清理构建缓存（减小镜像大小）
RUN rm -rf /tmp/* && \
    pnpm store prune && \
    pnpm cache clean --force || true

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["./scripts/start.sh"]
