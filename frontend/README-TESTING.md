# 测试指南

## 安装测试依赖

```bash
cd frontend
npm install
```

## 运行测试

```bash
# 运行所有测试
npm test

# 监视模式（自动运行相关测试）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 测试结构

测试文件遵循以下命名规范：
- 单元测试：`*.test.ts` 或 `*.spec.ts`
- 测试文件与源文件同目录，放在 `__tests__` 文件夹中

### 测试层级

1. **Repository 层测试**（单元测试）
   - `domain/{domain}/repository/queries/__tests__/`
   - `domain/{domain}/repository/commands/__tests__/`
   - 测试数据访问逻辑

2. **Application Service 层测试**（单元测试）
   - `domain/{domain}/application/__tests__/`
   - 测试业务逻辑和用例

3. **API Routes 测试**（集成测试）
   - `app/api/{resource}/__tests__/`
   - 测试 HTTP 接口

## 测试数据库

测试使用内存数据库（`:memory:`），每个测试套件运行前会清理数据。

## 编写新测试

### Repository 测试示例

```typescript
import { getTestDb } from '@/tests/setup/test-db';
import * as repository from '../repository';

jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return { db: getTestDb() };
});

describe('Repository Tests', () => {
  const db = getTestDb();
  
  beforeEach(async () => {
    await db.delete(table);
  });
  
  it('should work correctly', async () => {
    // 测试代码
  });
});
```

### Application Service 测试示例

```typescript
import { createUseCase } from '../use-case';

jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return { db: getTestDb() };
});

describe('Use Case Tests', () => {
  it('should return success result', async () => {
    const result = await createUseCase(userId, data);
    expect(result.success).toBe(true);
  });
});
```

## 注意事项

1. **测试隔离**：每个测试应该独立运行，不依赖其他测试
2. **清理数据**：使用 `beforeEach` 清理测试数据
3. **Mock 数据库**：使用 Jest mock 来替换生产数据库
4. **测试覆盖**：目标是覆盖核心业务逻辑

