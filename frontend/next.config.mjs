/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostgreSQL迁移后移除了better-sqlite3配置
  // 如需添加新的配置，请在此处添加
  
  // 启用 standalone 输出模式以减小 Docker 镜像大小
  output: 'standalone',
};


export default nextConfig;
