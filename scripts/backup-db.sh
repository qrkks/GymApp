#!/bin/bash

# SQLite数据库备份脚本
# 用法: ./backup-db.sh [database_path]

set -e

DB_PATH="${1:-./db/db.production.sqlite3}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sqlite3"

echo "🔄 开始备份SQLite数据库..."
echo "📁 数据库路径: $DB_PATH"
echo "💾 备份文件: $BACKUP_FILE"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 错误: 数据库文件不存在: $DB_PATH"
    exit 1
fi

# 执行SQLite备份（使用VACUUM INTO创建紧凑的备份）
echo "🗜️ 执行VACUUM INTO备份..."
sqlite3 "$DB_PATH" "VACUUM INTO '$BACKUP_FILE'"

# 验证备份文件
if [ -f "$BACKUP_FILE" ]; then
    ORIGINAL_SIZE=$(stat -f%z "$DB_PATH" 2>/dev/null || stat -c%s "$DB_PATH")
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")

    echo "✅ 备份完成!"
    echo "📊 原始大小: $(numfmt --to=iec-i --suffix=B $ORIGINAL_SIZE)"
    echo "📊 备份大小: $(numfmt --to=iec-i --suffix=B $BACKUP_SIZE)"
    echo "🗂️ 备份文件: $BACKUP_FILE"

    # 保留最近10个备份，删除旧的
    echo "🧹 清理旧备份..."
    ls -t "$BACKUP_DIR"/backup_*.sqlite3 2>/dev/null | tail -n +11 | xargs -r rm -f

    echo "🎉 备份成功完成!"
else
    echo "❌ 备份失败!"
    exit 1
fi
