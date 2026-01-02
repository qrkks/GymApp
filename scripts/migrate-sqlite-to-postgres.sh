#!/bin/bash

# SQLite 到 PostgreSQL 数据迁移脚本
# 使用方法: ./migrate-sqlite-to-postgres.sh <sqlite_file> <postgres_url>

set -e

# 参数检查
if [ $# -ne 2 ]; then
    echo "使用方法: $0 <sqlite_file> <postgres_url>"
    echo "示例: $0 ./db/production.db \"postgresql://user:pass@localhost:5432/gymapp\""
    exit 1
fi

SQLITE_FILE="$1"
POSTGRES_URL="$2"
BACKUP_DIR="./backups/migration-$(date +%Y%m%d_%H%M%S)"

echo "🚀 开始 SQLite → PostgreSQL 数据迁移"
echo "📁 SQLite文件: $SQLITE_FILE"
echo "🗄️  PostgreSQL: $POSTGRES_URL"
echo "💾 备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 步骤1: 备份SQLite数据库
echo "📦 步骤1: 备份SQLite数据库..."
sqlite3 "$SQLITE_FILE" ".backup '$BACKUP_DIR/sqlite_backup.db'"
echo "✅ SQLite备份完成: $BACKUP_DIR/sqlite_backup.db"

# 步骤2: 导出SQLite数据为SQL
echo "📤 步骤2: 导出SQLite数据..."
sqlite3 "$SQLITE_FILE" << 'EOF' > "$BACKUP_DIR/sqlite_data.sql"
-- 导出所有表结构和数据
.output sqlite_data.sql
.dump
EOF

# 清理转储文件中的SQLite特有语法
sed -i \
    -e 's/INTEGER PRIMARY KEY AUTOINCREMENT/SERIAL PRIMARY KEY/g' \
    -e 's/BOOLEAN/BOOLEAN/g' \
    -e 's/DATETIME/TIMESTAMP/g' \
    -e 's/"users"(/users(/g' \
    -e 's/"body_parts"(/body_parts(/g' \
    -e 's/"exercises"(/exercises(/g' \
    -e 's/"workouts"(/workouts(/g' \
    -e 's/"workout_sets"(/workout_sets(/g' \
    -e 's/"sets"(/sets(/g' \
    -e 's/"workout_body_parts"(/workout_body_parts(/g' \
    -e 's/PRAGMA.*;//g' \
    -e 's/BEGIN TRANSACTION;//g' \
    -e 's/COMMIT;//g' \
    "$BACKUP_DIR/sqlite_data.sql"

echo "✅ SQLite数据导出完成: $BACKUP_DIR/sqlite_data.sql"

# 步骤3: 准备PostgreSQL数据库
echo "🗄️  步骤3: 准备PostgreSQL数据库..."

# 创建数据库（如果不存在）
psql "$POSTGRES_URL" -c "CREATE DATABASE gymapp;" 2>/dev/null || echo "数据库已存在，继续..."

# 连接到目标数据库
TARGET_DB="${POSTGRES_URL}/gymapp"

# 步骤4: 创建PostgreSQL表结构
echo "📋 步骤4: 创建表结构..."
psql "$TARGET_DB" << 'EOF'
-- 创建表结构（适配PostgreSQL语法）

-- User table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    "emailVerified" BOOLEAN,
    image TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BodyPart table
CREATE TABLE IF NOT EXISTS body_parts (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- 添加唯一约束
ALTER TABLE body_parts ADD CONSTRAINT unique_user_body_part UNIQUE (user_id, name);

-- Exercise table
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    body_part_id INTEGER NOT NULL REFERENCES body_parts(id) ON DELETE CASCADE
);

-- 添加唯一约束
ALTER TABLE exercises ADD CONSTRAINT unique_user_exercise UNIQUE (user_id, name);

-- Workout table
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE
);

-- 添加唯一约束
ALTER TABLE workouts ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);

-- WorkoutBodyPart junction table
CREATE TABLE IF NOT EXISTS workout_body_parts (
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    body_part_id INTEGER NOT NULL REFERENCES body_parts(id) ON DELETE CASCADE,
    PRIMARY KEY (workout_id, body_part_id)
);

-- WorkoutSet table
CREATE TABLE IF NOT EXISTS workout_sets (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE
);

-- 添加唯一约束
ALTER TABLE workout_sets ADD CONSTRAINT unique_workout_exercise UNIQUE (workout_id, exercise_id);

-- Set table
CREATE TABLE IF NOT EXISTS sets (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_set_id INTEGER NOT NULL REFERENCES workout_sets(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_body_parts_user_id ON body_parts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_body_part_id ON exercises(body_part_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_user_id ON workout_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);
CREATE INDEX IF NOT EXISTS idx_sets_workout_set_id ON sets(workout_set_id);
CREATE INDEX IF NOT EXISTS idx_workout_body_parts_workout_id ON workout_body_parts(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_body_parts_body_part_id ON workout_body_parts(body_part_id);

EOF

echo "✅ 表结构创建完成"

# 步骤5: 迁移数据
echo "📊 步骤5: 迁移数据..."

# 使用Node.js脚本来安全地迁移数据
cat > "$BACKUP_DIR/migrate-data.js" << 'EOF'
const Database = require('better-sqlite3');
const { Pool } = require('pg');

// 连接数据库
const sqliteDb = new Database(process.argv[2]);
const pgPool = new Pool({ connectionString: process.argv[3] });

async function migrateTable(tableName, columns, pgTableName = tableName) {
    console.log(`迁移表: ${tableName} → ${pgTableName}`);

    try {
        // 获取SQLite数据
        const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
        console.log(`  找到 ${rows.length} 条记录`);

        if (rows.length === 0) return;

        // 构建PostgreSQL插入语句
        const columnNames = columns.join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const insertQuery = `INSERT INTO ${pgTableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

        // 批量插入数据
        const client = await pgPool.connect();
        try {
            for (const row of rows) {
                const values = columns.map(col => {
                    let value = row[col];
                    // 处理时间戳转换
                    if (col.includes('time') && value) {
                        // SQLite时间戳转换为PostgreSQL格式
                        value = new Date(value * 1000); // SQLite存储的是秒，转换为毫秒
                    }
                    return value;
                });
                await client.query(insertQuery, values);
            }
        } finally {
            client.release();
        }

        console.log(`  ✅ 迁移完成`);
    } catch (error) {
        console.error(`  ❌ 迁移失败 ${tableName}:`, error.message);
        throw error;
    }
}

async function migrateAllData() {
    try {
        console.log('🚀 开始数据迁移...');

        // 迁移所有表（按依赖顺序）
        await migrateTable('users', ['id', 'username', 'email', 'password', 'emailVerified', 'image', 'createdAt', 'updatedAt']);
        await migrateTable('body_parts', ['id', 'user_id', 'name']);
        await migrateTable('exercises', ['id', 'user_id', 'name', 'description', 'body_part_id']);
        await migrateTable('workouts', ['id', 'user_id', 'date', 'start_time', 'end_time']);
        await migrateTable('workout_body_parts', ['workout_id', 'body_part_id']);
        await migrateTable('workout_sets', ['id', 'user_id', 'workout_id', 'exercise_id']);
        await migrateTable('sets', ['id', 'user_id', 'workout_set_id', 'set_number', 'weight', 'reps']);

        console.log('✅ 数据迁移完成！');
    } catch (error) {
        console.error('❌ 数据迁移失败:', error);
        process.exit(1);
    } finally {
        await pgPool.end();
        sqliteDb.close();
    }
}

migrateAllData();
EOF

# 运行数据迁移脚本
echo "🔄 执行数据迁移..."
node "$BACKUP_DIR/migrate-data.js" "$SQLITE_FILE" "$TARGET_DB"

# 步骤6: 验证迁移结果
echo "🔍 步骤6: 验证迁移结果..."

# 比较表记录数
echo "📊 迁移结果对比:"

for table in users body_parts exercises workouts workout_body_parts workout_sets sets; do
    sqlite_count=$(sqlite3 "$SQLITE_FILE" "SELECT COUNT(*) FROM $table;")
    pg_count=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
    echo "  $table: SQLite=$sqlite_count, PostgreSQL=$pg_count"
done

# 步骤7: 生成迁移报告
echo "📝 步骤7: 生成迁移报告..."

cat > "$BACKUP_DIR/migration-report.md" << EOF
# 数据迁移报告
**迁移时间**: $(date)
**SQLite文件**: $SQLITE_FILE
**PostgreSQL**: $POSTGRES_URL

## 迁移结果

EOF

# 添加表统计到报告
for table in users body_parts exercises workouts workout_body_parts workout_sets sets; do
    sqlite_count=$(sqlite3 "$SQLITE_FILE" "SELECT COUNT(*) FROM $table;")
    pg_count=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
    echo "- **$table**: $sqlite_count → $pg_count 条记录" >> "$BACKUP_DIR/migration-report.md"
done

cat >> "$BACKUP_DIR/migration-report.md" << EOF

## 备份文件
- SQLite备份: sqlite_backup.db
- SQLite数据导出: sqlite_data.sql
- 迁移脚本: migrate-data.js

## 验证步骤
1. 检查记录数是否匹配
2. 运行应用测试基本功能
3. 检查数据完整性

EOF

echo "✅ 迁移报告生成: $BACKUP_DIR/migration-report.md"

echo ""
echo "🎉 数据迁移完成！"
echo "📁 所有文件保存在: $BACKUP_DIR"
echo "📋 迁移报告: $BACKUP_DIR/migration-report.md"
echo ""
echo "🔄 接下来请:"
echo "1. 验证迁移结果"
echo "2. 测试应用功能"
echo "3. 更新环境变量指向PostgreSQL"
echo "4. 部署新版本"
