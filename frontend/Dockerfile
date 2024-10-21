# 使用阿里云的 Node 镜像作为构建基础镜像
FROM registry.cn-beijing.aliyuncs.com/ciye/node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装生产依赖
RUN npm install --production

# 复制项目代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 使用阿里云的 Node 镜像作为最终的生产镜像
FROM registry.cn-beijing.aliyuncs.com/ciye/node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 仅复制构建后的文件和必要的文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
# COPY --from=builder /app/public ./public

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
