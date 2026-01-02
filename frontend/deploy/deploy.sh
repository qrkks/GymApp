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

  if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ 错误: POSTGRES_PASSWORD 环境变量未设置"
    echo "请设置 POSTGRES_PASSWORD 环境变量"
    exit 1
  fi

  echo "✅ 环境变量验证通过:"
  echo "🔐 AUTH_SECRET: [已设置]"
  echo "🌐 NEXTAUTH_URL: $NEXTAUTH_URL"
  echo "🏠 DOMAIN_NAME: $DOMAIN_NAME"
  echo "🐘 POSTGRES_PASSWORD: [已设置]"
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
        echo "💾 PostgreSQL 磁盘使用:"
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec postgres du -sh /var/lib/postgresql/data 2>/dev/null || echo "PostgreSQL 数据目录信息不可用"
        echo ""
        echo "📈 PostgreSQL 连接数:"
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec postgres psql -U postgres -d gymapp_prod -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "PostgreSQL 连接信息不可用"
        ;;

    "logs")
        echo "📝 服务日志:"
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
        ;;

    "backup")
        echo "💾 备份 PostgreSQL 数据库..."
            TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backups/backup_${TIMESTAMP}.sql"
            mkdir -p backups

        # 使用 pg_dump 备份数据库
        if docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T postgres pg_dump \
            -U postgres -d gymapp_prod > "$BACKUP_FILE" 2>/dev/null; then
            echo "✅ 备份完成: $BACKUP_FILE"
            # 压缩备份文件
            gzip "$BACKUP_FILE"
            echo "✅ 备份文件已压缩: ${BACKUP_FILE}.gz"

            # 保留最近5个备份
            ls -t backups/backup_*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
        else
            echo "❌ 数据库备份失败"
            echo "请确保 PostgreSQL 容器正在运行"
        fi
        ;;

    *)
        echo "❌ 未知操作: $ACTION"
        echo "📖 可用操作: start|stop|restart|status|logs|backup"
        exit 1
        ;;
esac

echo "✅ 操作完成"
