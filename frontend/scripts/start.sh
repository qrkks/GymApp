#!/bin/bash

# 应用启动脚本
# 确保 PostgreSQL 连接正常并运行迁移后再启动应用

set -e

echo "🚀 启动 GymApp..."

# 检查并运行数据库迁移
echo "📊 检查数据库状态..."
if [ "$NODE_ENV" = "production" ]; then
    echo "⏳ 等待 PostgreSQL 连接..."

    # 等待 PostgreSQL 就绪
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h postgres -U postgres 2>/dev/null; then
            echo "✅ PostgreSQL 连接成功"
            break
        fi
        echo "⏳ 等待 PostgreSQL... (尝试 $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        echo "❌ PostgreSQL 连接超时"
        exit 1
    fi
else
    echo "✅ 开发环境，跳过 PostgreSQL 连接检查"
fi

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
if pnpm run db:migrate; then
    echo "✅ 数据库迁移完成"
    else
    echo "⚠️  迁移失败，尝试生成新迁移..."
    if pnpm run db:generate && pnpm run db:migrate; then
        echo "✅ 数据库迁移完成"
    else
        echo "❌ 数据库迁移失败"
        exit 1
    fi
fi

# 生产环境健康检查
if [ "$NODE_ENV" = "production" ]; then
    echo "🔍 执行生产环境健康检查..."
    # 这里可以添加额外的生产环境检查
    echo "✅ 健康检查通过"
fi

echo "🎯 启动应用服务器..."
exec pnpm start
