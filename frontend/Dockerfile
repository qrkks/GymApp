# ========= base =========
FROM node:22-bookworm-slim AS base

ARG AUTH_SECRET
ARG DATABASE_PATH
ARG NEXTAUTH_URL

ENV AUTH_SECRET=${AUTH_SECRET}
ENV DATABASE_PATH=${DATABASE_PATH}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV AUTH_TRUST_HOST=true

WORKDIR /app

# ========= deps：安装依赖 =========
FROM base AS deps

# 用于安装依赖 & 后面编译原生模块
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then \
    yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# ========= builder：构建 Next.js 并在容器内编译 better-sqlite3 =========
FROM base AS builder

# 再装一次构建工具，用于 rebuild better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依赖 & 源码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⚠️ 关键：在容器里、用当前 Node 版本编译 better-sqlite3
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm rebuild better-sqlite3 --config.build_from_source=true; \
  elif [ -f package-lock.json ]; then \
    npm rebuild better-sqlite3 --build-from-source; \
  elif [ -f yarn.lock ]; then \
    yarn rebuild better-sqlite3 || yarn add better-sqlite3 --force; \
  else \
    true; \
  fi

# 构建 Next
RUN \
  if [ -f yarn.lock ]; then \
    yarn run build; \
  elif [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# ========= runner：生产环境镜像 =========
FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 拷贝 Next standalone 输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 拷贝已经在 builder 中编译好的 node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
