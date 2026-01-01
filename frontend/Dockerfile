FROM node:20-bookworm-slim

ARG AUTH_SECRET
ARG DATABASE_PATH
ARG NEXTAUTH_URL

ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_PATH=${DATABASE_PATH}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV AUTH_TRUST_HOST=true
ENV NODE_ENV=production

WORKDIR /app

# 1. 安装编译 native 模块需要的工具
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 2. 先装依赖（在容器里用 pnpm）
COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm \
  && pnpm install --frozen-lockfile \
  && pnpm rebuild better-sqlite3 --config.build_from_source=true

# 3. 再拷贝源码，构建 Next
COPY . .

RUN corepack enable pnpm && pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
