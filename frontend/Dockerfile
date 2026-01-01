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

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm \
  && pnpm install --frozen-lockfile \
  && pnpm rebuild better-sqlite3 --config.build_from_source=true \
  # 🔥 粗暴：再用 npm 单独编译一份 better-sqlite3 到 /app/node_modules
  && npm install better-sqlite3@12.5.0 --build-from-source

COPY . .

RUN corepack enable pnpm && pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
