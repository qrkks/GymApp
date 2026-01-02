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

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ sqlite3 curl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# 启用 pnpm
RUN corepack enable pnpm

# 复制依赖文件（利用缓存）
COPY package.json pnpm-lock.yaml* ./

# 安装依赖并重建 better-sqlite3
RUN pnpm install --frozen-lockfile && \
    echo "🔧 重建 better-sqlite3..." && \
    pnpm rebuild better-sqlite3 --config.build_from_source=true && \
    echo "✅ better-sqlite3 重建完成" && \
    pnpm store prune

# 复制源码
COPY . .

# 构建应用
RUN pnpm run build

# 创建数据库目录（在切换用户前）
RUN mkdir -p db

# 设置正确的权限，确保nextjs用户可以访问所有文件
RUN chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["bash", "./scripts/start.sh"]
