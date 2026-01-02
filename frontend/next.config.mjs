/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostgreSQL迁移后移除了better-sqlite3配置
  // 如需添加新的配置，请在此处添加
  
  // 启用 standalone 输出模式以减小 Docker 镜像大小
  // 在 Windows 上，standalone 模式需要开发者模式权限才能创建符号链接
  // 如果遇到 EPERM 错误，可以：
  // 1. 启用 Windows 开发者模式（推荐）
  // 2. 设置环境变量 NEXT_STANDALONE=false 来禁用
  // 3. 在 Docker 中构建（自动启用）
  output: process.env.NEXT_STANDALONE === 'false' ? undefined : 'standalone',
};


export default nextConfig;
