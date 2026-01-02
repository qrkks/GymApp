# 测试设置指南

## 数据库隔离策略

项目使用 PostgreSQL Schema 进行测试隔离，每个测试文件使用独立的 schema，确保测试完全隔离。

### 迁移现有测试文件

将以下模式的旧代码：

```typescript
// 旧代码
import { getTestDb } from '@/tests/setup/test-db';

// Mock the database module
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return {
    db: getTestDb(),
  };
});

describe('Test Suite', () => {
  const db = getTestDb();

  // ... 测试代码 ...

  // 可选：在测试结束后清理
  afterAll(async () => {
    // 旧的清理方式（如果需要）
  });
});
```

替换为新的隔离代码：

```typescript
// 新代码
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('Test Suite', () => {
  const db = createTestDb(__filename);

  // ... 测试代码 ...

  // 必须：在测试结束后清理schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});
```

### 主要变化

1. **导入**: `getTestDb` → `createTestDb, cleanupTestDb`
2. **Mock**: 使用 `createTestDb(__filename)` 创建隔离实例
3. **清理**: 使用 `cleanupTestDb(__filename)` 清理schema

### 数据库配置

测试数据库配置位于 `tests/setup/test-db.ts`：

- **主机**: `localhost`
- **端口**: `5432`
- **数据库**: `gymapp`
- **用户**: `postgres`
- **密码**: `postgres`

可以通过环境变量覆盖：
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_TEST_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Schema命名规则

每个测试文件自动生成唯一的schema名称：
```
test_{domain}_{filename}_{randomId}
```

例如：`test_user_repository_commands_abc123`

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行带覆盖率的测试
pnpm test:coverage

# 运行特定测试文件
pnpm test path/to/test/file.test.ts

# 清理残留的测试schema
pnpm db:cleanup-test-schemas
```

### Schema清理机制

#### 自动清理
- 每个测试文件在 `afterAll` 中会自动清理自己的schema
- 测试正常结束时，所有schema都会被删除

#### 手动清理
如果测试意外中断或需要清理残留schema：

```bash
pnpm db:cleanup-test-schemas
```

这个脚本会：
1. 连接到测试数据库
2. 查找所有以 `test_` 开头的schema
3. 逐个删除这些schema及其所有内容

#### 清理脚本位置
- 脚本文件: `scripts/cleanup-test-schemas.js`
- npm脚本: `db:cleanup-test-schemas`

### 故障排除

1. **Schema创建失败**: 检查数据库用户权限
2. **连接超时**: 确认PostgreSQL服务正在运行
3. **表不存在**: 确保数据库有正确的表结构
4. **Schema残留**: 运行 `pnpm db:cleanup-test-schemas` 清理

### 最佳实践

1. 每个测试文件使用 `__filename` 确保唯一性
2. 在 `afterAll` 中清理资源
3. 避免在测试间共享数据
4. 使用有意义的测试用户ID和数据
