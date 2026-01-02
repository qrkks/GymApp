#!/bin/bash

# SQLite数据库健康检查脚本
# 用法: ./check-db-health.sh [database_path]

DB_PATH="${1:-./db/db.production.sqlite3}"

echo "🔍 检查SQLite数据库健康状态..."
echo "📁 数据库路径: $DB_PATH"

# 检查文件是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库文件不存在: $DB_PATH"
    exit 1
fi

# 检查文件权限
if [ ! -r "$DB_PATH" ]; then
    echo "❌ 数据库文件不可读: $DB_PATH"
    exit 1
fi

# 检查SQLite完整性
echo "🔧 检查数据库完整性..."
INTEGRITY_CHECK=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>&1)
if [[ "$INTEGRITY_CHECK" == "ok" ]]; then
    echo "✅ 数据库完整性检查通过"
else
    echo "❌ 数据库完整性检查失败: $INTEGRITY_CHECK"
    exit 1
fi

# 检查数据库统计信息
echo "📊 数据库统计信息:"
echo "大小: $(du -h "$DB_PATH" | cut -f1)"
echo "修改时间: $(stat -c %y "$DB_PATH" 2>/dev/null || stat -f %Sm -t "%Y-%m-%d %H:%M:%S" "$DB_PATH")"

# 检查表数量
TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
echo "表数量: $TABLE_COUNT"

# 检查journal模式
JOURNAL_MODE=$(sqlite3 "$DB_PATH" "PRAGMA journal_mode;")
echo "Journal模式: $JOURNAL_MODE"

# 检查WAL文件状态
DB_DIR=$(dirname "$DB_PATH")
DB_NAME=$(basename "$DB_PATH" .sqlite3)
WAL_FILE="$DB_DIR/$DB_NAME-wal"
SHM_FILE="$DB_DIR/$DB_NAME-shm"

if [ -f "$WAL_FILE" ]; then
    WAL_SIZE=$(du -h "$WAL_FILE" | cut -f1)
    echo "WAL文件大小: $WAL_SIZE"
fi

if [ -f "$SHM_FILE" ]; then
    SHM_SIZE=$(du -h "$SHM_FILE" | cut -f1)
    echo "SHM文件大小: $SHM_SIZE"
fi

# 检查数据库连接
echo "🔌 测试数据库连接..."
CONNECTION_TEST=$(sqlite3 "$DB_PATH" "SELECT 'Connection OK' as status;" 2>&1)
if [[ "$CONNECTION_TEST" == "Connection OK" ]]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败: $CONNECTION_TEST"
    exit 1
fi

# 检查用户表
USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
echo "用户数量: $USER_COUNT"

WORKOUT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM workouts;" 2>/dev/null || echo "0")
echo "训练记录数量: $WORKOUT_COUNT"

echo "🎉 数据库健康检查完成!"
