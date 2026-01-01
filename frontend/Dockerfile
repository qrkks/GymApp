FROM node:22-bookworm-slim

# ===== 环境变量（按你原来的来）=====
ARG AUTH_SECRET
ARG DATABASE_PATH
ARG NEXTAUTH_URL

ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_PATH=${DATABASE_PATH}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV AUTH_TRUST_HOST=true
ENV NODE_ENV=production

WORKDIR /app

# ===== 安装构建 native 模块需要的工具 =====
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# ===== 先只拷 package.json + pnpm-lock.yaml，安装依赖 =====
COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm \
  && pnpm install --frozen-lockfile \
  # 关键：在容器里、用当前 Node 版本重新编译 better-sqlite3
  && pnpm rebuild better-sqlite3 --config.build_from_source=true

# ===== 再拷贝剩下的代码，构建 Next.js =====
COPY . .

RUN corepack enable pnpm && pnpm run build

# ===== 对外端口 & 启动命令 =====
EXPOSE 3000

CMD ["pnpm", "start"]
