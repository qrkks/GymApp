# 使用官方 Node.js 镜像作为构建基础镜像
FROM node:18 AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 安装依赖
RUN npm install

# 复制所有项目文件到工作目录
COPY . .

# 构建 Next.js 项目
RUN npm run build

# 使用更小的基础镜像运行应用
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 从之前的构建阶段复制文件到当前镜像中
COPY --from=builder /app ./

# 安装仅生产环境需要的依赖
RUN npm install --only=production

# 暴露应用运行的端口
EXPOSE 3000

# 启动 Next.js 应用
CMD ["npm", "run", "start"]
