#!/bin/bash

# 健康检查等待脚本
# 用于 CI/CD 部署时等待应用完全启动

set -e

HEALTH_URL="${1:-http://localhost:3000/api/health}"
MAX_ATTEMPTS="${2:-30}"
WAIT_INTERVAL="${3:-3}"

echo "🔍 等待应用健康检查..."
echo "📍 健康检查 URL: $HEALTH_URL"
echo "⏱️  最大等待时间: $((MAX_ATTEMPTS * WAIT_INTERVAL)) 秒"

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    # 尝试健康检查
    if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ 应用健康检查通过 (尝试 $attempt/$MAX_ATTEMPTS)"
        exit 0
    fi
    
    echo "⏳ 等待应用启动... (尝试 $attempt/$MAX_ATTEMPTS)"
    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

echo "❌ 应用健康检查失败：在 $((MAX_ATTEMPTS * WAIT_INTERVAL)) 秒内未响应"
echo "💡 提示：应用可能仍在启动中（数据库迁移、服务器启动等）"
exit 1

