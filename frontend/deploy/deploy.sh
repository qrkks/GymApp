#!/bin/bash

# GymApp 部署脚本
# 用法: ./deploy.sh [action]
# action: start|stop|restart|status|logs

set -e

ACTION=${1:-start}
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="gymapp"

echo "🚀 GymApp 部署脚本"
echo "📋 操作: $ACTION"

# Validate required environment variables
if [ "$ACTION" = "start" ] || [ "$ACTION" = "restart" ]; then
  if [ -z "$AUTH_SECRET" ]; then
    echo "❌ 错误: AUTH_SECRET 环境变量未设置"
    echo "请设置 AUTH_SECRET 环境变量"
    exit 1
  fi

  if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ 错误: NEXTAUTH_URL 环境变量未设置"
    echo "请设置 NEXTAUTH_URL 环境变量"
    exit 1
  fi

  if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ 错误: DOMAIN_NAME 环境变量未设置"
    echo "请设置 DOMAIN_NAME 环境变量"
    exit 1
  fi

  echo "✅ 环境变量验证通过:"
  echo "🔐 AUTH_SECRET: [已设置]"
  echo "🌐 NEXTAUTH_URL: $NEXTAUTH_URL"
  echo "🏠 DOMAIN_NAME: $DOMAIN_NAME"
fi

case $ACTION in
    "start")
        echo "🐳 启动服务..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
        echo "⏳ 等待服务启动..."
        sleep 10
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
        ;;

    "stop")
        echo "🛑 停止服务..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down
        ;;

    "restart")
        echo "🔄 重启服务..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
        ;;

    "status")
        echo "📊 服务状态:"
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
        echo ""
        echo "💾 磁盘使用:"
        du -sh db/ 2>/dev/null || echo "数据库目录不存在"
        ;;

    "logs")
        echo "📝 服务日志:"
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
        ;;

    "backup")
        echo "💾 备份数据库..."
        if [ -f "db/db.production.sqlite3" ]; then
            TIMESTAMP=$(date +%Y%m%d_%H%M%S)
            BACKUP_FILE="backups/backup_${TIMESTAMP}.sqlite3"
            mkdir -p backups
            sqlite3 db/db.production.sqlite3 "VACUUM INTO '$BACKUP_FILE'"
            echo "✅ 备份完成: $BACKUP_FILE"
            # 保留最近5个备份
            ls -t backups/backup_*.sqlite3 2>/dev/null | tail -n +6 | xargs -r rm -f
        else
            echo "❌ 数据库文件不存在"
        fi
        ;;

    *)
        echo "❌ 未知操作: $ACTION"
        echo "📖 可用操作: start|stop|restart|status|logs|backup"
        exit 1
        ;;
esac

echo "✅ 操作完成"
