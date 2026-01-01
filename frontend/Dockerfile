FROM node:22-bookworm-slim AS base

ARG AUTH_SECRET
ARG DATABASE_PATH
ARG NEXTAUTH_URL

ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_PATH=${DATABASE_PATH}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV AUTH_TRUST_HOST=true

WORKDIR /app

# ========== deps：安装依赖 ==========
FROM base AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ========== builder：构建 Next.js ==========
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 可选：在这里也 rebuild 一次（更稳）
RUN corepack enable pnpm && pnpm rebuild better-sqlite3 --config.build_from_source=true

RUN corepack enable pnpm && pnpm run build

# ========== runner：生产环境 ==========
FROM node:22-bookworm-slim AS runner

ARG AUTH_SECRET
ARG DATABASE_PATH
ARG NEXTAUTH_URL

ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_PATH=${DATABASE_PATH}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV AUTH_TRUST_HOST=true

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 拷贝构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 拷贝依赖信息（在 runner 里重新安装）
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 用 root 装依赖
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable pnpm \
  && pnpm install --prod --frozen-lockfile \
  && pnpm rebuild better-sqlite3 --config.build_from_source=true

# 再切回普通用户
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
