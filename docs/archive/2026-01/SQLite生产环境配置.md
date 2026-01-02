# SQLite 生产环境配置指南

## ⚠️ 重要警告

虽然SQLite适合小型应用，但生产环境使用需要特别注意以下限制：

### 🚫 SQLite生产环境限制
- **不支持多进程并发写入**
- **单点故障风险高**
- **备份恢复相对复杂**
- **监控和维护成本较高**

**建议**: 如果预期用户量 > 100 或需要高可用性，考虑升级到 PostgreSQL/MySQL。

## ✅ 已修复的问题

### 1. WAL模式启用
```sql
PRAGMA journal_mode = WAL;
```
**好处**:
- 允许多个读取器和一个写入器同时工作
- 减少写入锁定时间
- 提高并发性能

### 2. 性能优化配置
```sql
PRAGMA synchronous = NORMAL;     -- 平衡性能和安全性
PRAGMA cache_size = 1000000;     -- 1GB缓存
PRAGMA temp_store = memory;      -- 临时表存储在内存
PRAGMA mmap_size = 268435456;    -- 256MB内存映射
```

### 3. 数据库持久化
- ✅ 正确配置Docker volume挂载
- ✅ 使用非root用户运行容器
- ✅ 数据库文件存储在主机目录

### 4. 自动备份
- ✅ Git Action部署时自动备份
- ✅ 保留最近5个备份文件
- ✅ 使用VACUUM INTO创建紧凑备份

## 🔧 使用方法

### 本地开发
```bash
# 初始化数据库
cd frontend
pnpm run db:init

# 检查数据库健康
../scripts/check-db-health.sh

# 备份数据库
../scripts/backup-db.sh
```

### 生产部署
```bash
# 使用Docker Compose
docker-compose up -d

# 检查容器状态
docker-compose ps

# 查看容器日志
docker-compose logs gymapp

# 检查数据库健康
docker-compose exec gymapp sqlite3 /app/db/db.production.sqlite3 "PRAGMA integrity_check;"

# 手动备份
docker-compose exec gymapp sqlite3 /app/db/db.production.sqlite3 "VACUUM INTO '/app/db/backup_manual.sqlite3'"
```

## 📊 监控要点

### 关键指标
1. **数据库文件大小**
   ```bash
   du -h db/db.production.sqlite3
   ```

2. **WAL文件状态**
   ```bash
   ls -la db/*-wal db/*-shm 2>/dev/null || echo "No WAL files"
   ```

3. **连接状态**
   ```bash
   sqlite3 db/db.production.sqlite3 "SELECT COUNT(*) FROM sqlite_master;"
   ```

4. **性能统计**
   ```sql
   -- 查看数据库统计
   .stats on
   .tables
   ```

### 告警阈值
- **数据库大小**: > 1GB 考虑清理历史数据
- **WAL文件**: 持续存在表示写入频繁
- **响应时间**: API响应 > 2秒 需要优化
- **错误率**: 数据库错误 > 1% 需要检查

## 🔄 维护任务

### 每日检查
```bash
# 检查数据库完整性
sqlite3 db/db.production.sqlite3 "PRAGMA integrity_check;"

# 清理WAL文件（如果需要）
sqlite3 db/db.production.sqlite3 "PRAGMA wal_checkpoint(TRUNCATE);"
```

### 每周维护
```bash
# 重新组织数据库
sqlite3 db/db.production.sqlite3 "VACUUM;"

# 分析查询性能
sqlite3 db/db.production.sqlite3 "ANALYZE;"
```

### 每月备份验证
```bash
# 验证备份文件完整性
for backup in backups/backup_*.sqlite3; do
  sqlite3 "$backup" "PRAGMA integrity_check;" | grep -q "ok" && echo "$backup: OK" || echo "$backup: FAILED"
done
```

## 🚨 故障排除

### 数据库锁定问题
```bash
# 检查锁定状态
sqlite3 db/db.production.sqlite3 "SELECT * FROM sqlite_master;"

# 如果锁定，检查连接进程
lsof db/db.production.sqlite3
```

### 磁盘空间不足
```bash
# 检查磁盘使用情况
df -h

# 清理不需要的文件
docker system prune -a
rm -rf backups/backup_old_*.sqlite3
```

### 性能问题
```bash
# 检查慢查询
sqlite3 db/db.production.sqlite3 ".timer on" "EXPLAIN QUERY PLAN SELECT * FROM workouts LIMIT 10;"

# 优化索引
sqlite3 db/db.production.sqlite3 "CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);"
```

## 🔄 迁移到关系型数据库

如果需要升级到PostgreSQL/MySQL：

1. **导出数据**
   ```bash
   # 使用脚本导出SQLite数据
   node scripts/export-sqlite-data.js > data.sql
   ```

2. **设置新数据库**
   ```bash
   # 创建PostgreSQL数据库
   createdb gymapp_prod
   psql gymapp_prod < data.sql
   ```

3. **更新应用配置**
   - 修改 `DATABASE_URL` 环境变量
   - 更新 Drizzle 配置
   - 测试数据迁移

## 📈 扩展建议

### 短期优化 (用户 < 100)
- ✅ WAL模式
- ✅ 定期备份
- ✅ 监控指标
- ✅ 性能优化PRAGMA

### 中期优化 (用户 100-1000)
- 🔄 考虑读写分离
- 🔄 添加Redis缓存
- 🔄 实施数据清理策略
- 🔄 升级到PostgreSQL

### 长期规划 (用户 > 1000)
- 🚀 微服务架构
- 🚀 分布式数据库
- 🚀 专业的运维团队
- 🚀 自动化监控告警

---

**最后更新：** 2026年1月2日
**适用场景：** 小型健身应用生产环境
