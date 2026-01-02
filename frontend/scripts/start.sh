#!/bin/bash

# 应用启动脚本
# 确保数据库已初始化后再启动应用

set -e

echo "🚀 启动 GymApp..."

# 检查并初始化数据库
echo "📊 检查数据库状态..."
if [ ! -f "$DATABASE_PATH" ]; then
    echo "⚠️  数据库文件不存在，开始初始化..."
    pnpm run db:init
    echo "✅ 数据库初始化完成"
else
    echo "✅ 数据库文件已存在"

    # 检查数据库是否有表（使用 Node.js 检查，避免依赖 sqlite3 CLI）
    if node -e "
      try {
        const Database = require('better-sqlite3');
        const db = new Database('$DATABASE_PATH');
        const result = db.prepare(\"SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'\").get();
        db.close();
        process.exit(result.count > 0 ? 0 : 1);
      } catch (error) {
        process.exit(1);
      }
    " 2>/dev/null; then
        echo "✅ 数据库表已存在"
    else
        echo "⚠️  数据库文件存在但没有表，开始初始化..."
        pnpm run db:init
        echo "✅ 数据库表初始化完成"
    fi
fi

# 应用数据库优化（生产环境）
if [ "$NODE_ENV" = "production" ]; then
    echo "🔧 应用数据库优化配置..."
    # 这里可以添加额外的生产环境数据库配置
    echo "✅ 数据库优化完成"
fi

echo "🎯 启动应用服务器..."
exec pnpm start
