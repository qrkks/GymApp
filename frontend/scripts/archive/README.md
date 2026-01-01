# 归档脚本

此目录包含已使用的一次性脚本，保留作为参考。

## 脚本列表

### import-production-db.ts
- **用途**: 从 Django 生产数据库导入数据
- **状态**: 已使用，数据迁移完成
- **说明**: 用于将 Django 后端的数据迁移到新的 Next.js 应用

### reset-all-passwords.ts
- **用途**: 批量重置所有用户密码为 "123698"
- **状态**: 已使用，密码重置完成
- **说明**: 用于修复 Django 密码格式不兼容问题

### check-password-format.ts
- **用途**: 检查数据库中用户密码格式（Django PBKDF2 vs bcrypt）
- **状态**: 已使用，密码格式检查完成
- **说明**: 临时诊断脚本，用于检查迁移后的密码格式兼容性

### test-django-password.ts
- **用途**: 测试 Django PBKDF2 密码验证功能
- **状态**: 已使用，密码验证功能测试完成
- **说明**: 临时测试脚本，用于验证密码工具对 Django 格式的支持

## 使用说明

如需重新使用这些脚本，请：

1. 检查脚本中的配置是否仍然适用
2. 确认数据库路径和连接信息
3. 备份数据后再执行
4. 使用 `pnpm tsx scripts/archive/<script-name>` 或 `tsx scripts/archive/<script-name>` 运行

