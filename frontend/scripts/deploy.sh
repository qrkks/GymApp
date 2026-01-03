#!/bin/bash

# 部署脚本
# 确保先停止旧容器，再启动新容器

set -e

COMPOSE_FILE="${1:-docker-compose.yml}"
HEALTH_URL="${2:-http://localhost:3000/api/health}"
MAX_WAIT_ATTEMPTS="${3:-30}"
WAIT_INTERVAL="${4:-3}"

echo "🚀 开始部署 GymApp..."
echo "📄 Compose 文件: $COMPOSE_FILE"
echo "🏥 健康检查 URL: $HEALTH_URL"

# 检查 compose 文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 错误: Compose 文件不存在: $COMPOSE_FILE"
    exit 1
fi

# 步骤 1: 停止并删除旧容器
echo ""
echo "🛑 步骤 1: 停止旧容器..."
if docker compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
    echo "   发现运行中的容器，正在停止..."
    docker compose -f "$COMPOSE_FILE" down
    echo "✅ 旧容器已停止并删除"
else
    echo "   没有运行中的容器"
fi

# 等待一下，确保容器完全停止
sleep 2

# 步骤 2: 启动新容器
echo ""
echo "🚀 步骤 2: 启动新容器..."
docker compose -f "$COMPOSE_FILE" up -d

if [ $? -ne 0 ]; then
    echo "❌ 容器启动失败"
    docker compose -f "$COMPOSE_FILE" logs
    exit 1
fi

echo "✅ 容器已启动"

# 步骤 3: 等待应用健康
echo ""
echo "⏳ 步骤 3: 等待应用健康检查..."
echo "   最多等待 $((MAX_WAIT_ATTEMPTS * WAIT_INTERVAL)) 秒"

attempt=1
while [ $attempt -le $MAX_WAIT_ATTEMPTS ]; do
    # 检查容器是否在运行
    if ! docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo "❌ 容器已停止，检查日志..."
        docker compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
    
    # 尝试健康检查
    if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ 应用健康检查通过 (尝试 $attempt/$MAX_WAIT_ATTEMPTS)"
        break
    fi
    
    echo "   ⏳ 等待应用启动... (尝试 $attempt/$MAX_WAIT_ATTEMPTS)"
    sleep $WAIT_INTERVAL
    attempt=$((attempt + 1))
done

# 检查是否成功
if [ $attempt -gt $MAX_WAIT_ATTEMPTS ]; then
    echo ""
    echo "❌ 应用健康检查失败：在 $((MAX_WAIT_ATTEMPTS * WAIT_INTERVAL)) 秒内未响应"
    echo ""
    echo "📋 容器状态:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "📝 应用日志:"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 gymapp
    exit 1
fi

# 步骤 4: 显示最终状态
echo ""
echo "📊 步骤 4: 最终状态检查..."
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "✅ 部署完成！"
echo "🌐 应用地址: $HEALTH_URL"

