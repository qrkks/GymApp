# 迁移脚本归档

本目录包含已废弃的迁移脚本。

## 已废弃的脚本

### migrate-sqlite-to-postgres.sh

**状态**：已废弃

**替代方案**：使用 `frontend/scripts/migrate-sqlite-to-server-pg.ts`

**原因**：
- 旧的 bash 脚本使用 SQL 转储方式，不够灵活
- 新的 TypeScript 脚本直接处理数据转换，支持更好的错误处理
- 新脚本已修复列名大小写问题（PostgreSQL 驼峰列名）

**保留原因**：作为历史参考，展示迁移方案的演进过程。

