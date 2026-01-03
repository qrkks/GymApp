# SQLite 到 PostgreSQL 数据迁移指南

> ⚠️ **已废弃**：本文档已被新的迁移指南替代。
> 
> **新文档**：请使用 `docs/数据迁移到服务器PostgreSQL.md`
> 
> **新脚本**：请使用 `frontend/scripts/migrate-sqlite-to-server-pg.ts`
> 
> 本文档保留作为历史参考。

## 📋 迁移概述

本指南介绍如何将现有SQLite数据库数据安全迁移到PostgreSQL。

## 🔧 迁移工具

### 主要脚本
- `scripts/migrate-sqlite-to-postgres.sh` - 完整迁移脚本
- `scripts/verify-migration.js` - 迁移结果验证脚本

### 依赖要求
```bash
# Ubuntu/Debian
sudo apt-get install sqlite3 postgresql-client

# Node.js依赖
npm install pg better-sqlite3
```

## 🚀 迁移步骤

### 步骤1: 准备环境

1. **确保SQLite数据库存在**
   ```bash
   ls -la db/production.db  # 检查数据库文件
   ```

2. **启动PostgreSQL服务**
   ```bash
   # 使用Docker启动PostgreSQL
   docker run -d \
     --name postgres-migration \
     -e POSTGRES_DB=gymapp \
     -e POSTGRES_USER=gymapp \
     -e POSTGRES_PASSWORD=your_password \
     -p 5432:5432 \
     postgres:15
   ```

3. **设置环境变量**
   ```bash
   export DATABASE_URL="postgresql://gymapp:your_password@localhost:5432/gymapp"
   ```

### 步骤2: 执行迁移

```bash
# 运行迁移脚本
./scripts/migrate-sqlite-to-postgres.sh ./db/production.db "$DATABASE_URL"
```

**脚本执行过程**:
1. 📦 备份SQLite数据库
2. 📤 导出SQLite数据为SQL文件
3. 🗄️ 创建PostgreSQL表结构
4. 📊 迁移所有数据记录
5. 🔍 生成迁移报告

### 步骤3: 验证迁移结果

```bash
# 运行验证脚本
node scripts/verify-migration.js
```

**验证内容**:
- ✅ 表结构完整性
- ✅ 数据记录数量
- ✅ 外键关系完整性
- ✅ 数据质量检查
- ✅ 样本数据展示

## 📊 预期输出

### 迁移脚本输出示例
```
🚀 开始 SQLite → PostgreSQL 数据迁移
📁 SQLite文件: ./db/production.db
🗄️  PostgreSQL: postgresql://gymapp:pass@localhost:5432/gymapp
💾 备份目录: ./backups/migration-20240102_143000

📦 步骤1: 备份SQLite数据库...
✅ SQLite备份完成

📤 步骤2: 导出SQLite数据...
✅ SQLite数据导出完成

🗄️  步骤3: 准备PostgreSQL数据库...
✅ 连接成功

📋 步骤4: 创建表结构...
✅ 表结构创建完成

📊 步骤5: 迁移数据...
迁移表: users → users
  找到 5 条记录
  ✅ 迁移完成
迁移表: body_parts → body_parts
  找到 12 条记录
  ✅ 迁移完成
...

🔍 步骤6: 验证迁移结果...
📊 迁移结果对比:
  users: SQLite=5, PostgreSQL=5
  body_parts: SQLite=12, PostgreSQL=12
  ...

📝 步骤7: 生成迁移报告...
✅ 迁移报告生成

🎉 数据迁移完成！
```

### 验证脚本输出示例
```
🔍 开始验证PostgreSQL迁移结果...

📋 验证表结构:
  users: ✅ 存在
  body_parts: ✅ 存在
  exercises: ✅ 存在
  workouts: ✅ 存在
  workout_body_parts: ✅ 存在
  workout_sets: ✅ 存在
  sets: ✅ 存在

📊 验证数据记录数:
  users: 5 条记录
  body_parts: 12 条记录
  exercises: 25 条记录
  ...

🔗 验证数据关系完整性:
  用户 → 身体部位: ✅ 完整
  身体部位 → 动作: ✅ 完整
  ...

🧪 验证数据质量:
  用户名不为空: ✅ 通过
  训练日期不为空: ✅ 通过
  ...

🎉 验证完成！
```

## 🛠️ 故障排除

### 常见问题

#### 1. 连接PostgreSQL失败
```bash
# 检查PostgreSQL服务状态
docker ps | grep postgres

# 检查连接
psql "$DATABASE_URL" -c "SELECT version();"
```

#### 2. 数据迁移失败
```bash
# 检查SQLite数据库
sqlite3 ./db/production.db ".tables"
sqlite3 ./db/production.db "SELECT COUNT(*) FROM users;"

# 检查PostgreSQL权限
psql "$DATABASE_URL" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gymapp;"
```

#### 3. 字符编码问题
```bash
# 检查SQLite编码
sqlite3 ./db/production.db "PRAGMA encoding;"

# PostgreSQL设置为UTF8
psql "$DATABASE_URL" -c "SHOW client_encoding;"
```

### 回滚方案

如果迁移失败，可以恢复SQLite数据：

```bash
# 从备份恢复SQLite
cp ./backups/migration-20240102_143000/sqlite_backup.db ./db/production.db

# 清理PostgreSQL数据
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## 📁 迁移文件结构

```
backups/migration-20240102_143000/
├── sqlite_backup.db          # SQLite完整备份
├── sqlite_data.sql          # 导出的SQL数据
├── migrate-data.js          # Node.js迁移脚本
└── migration-report.md      # 迁移结果报告
```

## ✅ 迁移成功标准

- [ ] 所有表结构正确创建
- [ ] 数据记录数量完全匹配
- [ ] 外键关系完整无破损
- [ ] 数据质量检查全部通过
- [ ] 应用基本功能正常工作

## 🔄 后续步骤

迁移完成后：

1. **更新应用配置**
   ```bash
   # 修改环境变量
   DATABASE_URL="postgresql://gymapp:pass@localhost:5432/gymapp"
   ```

2. **重新部署应用**
   ```bash
   git push origin main  # 触发GitHub Actions
   ```

3. **监控应用运行**
   ```bash
   # 检查应用日志
   docker compose logs gymapp

   # 验证API端点
   curl http://localhost:3000/api/health
   ```

## 📞 支持

如果遇到问题，请检查：
1. 迁移脚本的错误输出
2. PostgreSQL和SQLite的版本兼容性
3. 网络连接和权限设置
4. 备份目录中的日志文件
