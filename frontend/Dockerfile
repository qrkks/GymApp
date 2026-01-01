# ========= Base =========
FROM node:22-bookworm-slim AS base

WORKDIR /app

# 建议：不要把 AUTH_SECRET / DATABASE_PATH / NEXTAUTH_URL 写进镜像层（安全&可维护）
# 这些用 docker run 的 -e 或 compose 来注入即可。
ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true

# ========= Dependencies (install + native build) =========
FROM base AS deps

# better-sqlite3 需要编译工具链
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 复制 lockfiles（按你的包管理器）
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# 安装依赖（支持 yarn / npm / pnpm）
RUN \
  if [ -f yarn.lock ]; then \
    corepack enable && yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

#（可选但更稳）强制重建 better-sqlite3，避免某些情况下 postinstall 没跑干净
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm rebuild better-sqlite3; \
  elif [ -f package-lock.json ]; then \
    npm rebuild better-sqlite3; \
  else \
    true; \
  fi


# ========= Builder (next build) =========
FROM base AS builder

# build 阶段也需要工具链（有些项目 build 时会触发 native rebuild）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 带上 node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js build（支持 yarn / npm / pnpm）
RUN \
  if [ -f yarn.lock ]; then \
    corepack enable && yarn build; \
  elif [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi


# ========= Runner (production) =========
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next standalone 输出
# 注意：standalone 目录里通常有 server.js 和必要的 server chunks
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ✅ 关键：把依赖带进来（better-sqlite3 的 native binding 就在里面）
COPY --from=deps /app/node_modules ./node_modules

#（可选但推荐）带上 package.json（有些运行时读取它）
COPY --from=builder /app/package.json ./package.json

# 如果你有 public 目录需要静态资源，取消注释
# COPY --from=builder /app/public ./public

# 权限
RUN mkdir -p .next && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
