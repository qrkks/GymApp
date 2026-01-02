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

# 1. native 模块需要的工具
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ sqlite3 \
  && rm -rf /var/lib/apt/lists/*

# 2. 先拷依赖声明（lock 有就用，没有也无所谓）
COPY package.json pnpm-lock.yaml* ./

# 3. 直接 pnpm install（不加 --frozen-lockfile）
RUN corepack enable pnpm \
  && pnpm install \
  && echo "🔧 重建 better-sqlite3..." \
  && pnpm rebuild better-sqlite3 --config.build_from_source=true \
  && echo "✅ better-sqlite3 重建完成"

# 4. 再拷源码，构建 Next
COPY . .

RUN corepack enable pnpm && pnpm run build

# 确保启动脚本可执行
RUN chmod +x scripts/start.sh

EXPOSE 3000

CMD ["./scripts/start.sh"]
