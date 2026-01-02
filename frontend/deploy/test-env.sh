#!/bin/bash

# 测试环境变量传递的脚本
echo "🧪 Testing environment variable passing..."

# 检查环境变量
echo ""
echo "🔧 Current environment variables:"
echo "AUTH_SECRET: ${AUTH_SECRET:+[SET]} ${AUTH_SECRET:-[NOT SET]}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-[NOT SET]}"
echo "DOMAIN_NAME: ${DOMAIN_NAME:-[NOT SET]}"
echo "NODE_ENV: ${NODE_ENV:-[NOT SET]}"

# 测试容器环境变量
echo ""
echo "🐳 Testing container environment variables:"
if docker ps | grep -q gymapp-frontend; then
    echo "Container environment variables:"
    docker exec gymapp-frontend env | grep -E "(AUTH_SECRET|NEXTAUTH_URL|DOMAIN_NAME|NODE_ENV)" | \
        sed 's/AUTH_SECRET=.*/AUTH_SECRET=[HIDDEN]/' || echo "Could not read container env"
else
    echo "❌ Container not running"
fi

# 测试健康检查
echo ""
echo "🏥 Testing health check:"
curl -s http://localhost:3000/api/health || echo "❌ Health check failed"

echo ""
echo "✅ Environment test complete"
