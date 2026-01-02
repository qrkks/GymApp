/**
 * User API Route (me) 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { GET } from '../route';
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import { users } from '@/lib/db/schema';

// Mock auth-helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
}));

// Mock database
jest.mock('@/lib/db', () => {
  const { createTestDb } = require('@/tests/setup/test-db');
  return {
    db: createTestDb(__filename),
  };
});

import { requireAuth } from '@/lib/auth-helpers';

describe('GET /api/user/me', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(users);

    // 创建测试用户（使用唯一的用户名和邮箱）
    await userCommands.insertUser({
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
    });

    // Mock requireAuth
    (requireAuth as jest.Mock).mockResolvedValue({ id: testUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestDb(__filename);
  });

  it('应该成功获取当前用户信息并返回有效的 JSON', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('id', testUserId);
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理未授权请求并返回 401 错误', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该确保响应是有效的 JSON（不会返回 HTML）', async () => {
    const response = await GET();

    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('text/html');

    const text = await response.text();
    expect(() => {
      const parsed = JSON.parse(text);
      JSON.stringify(parsed);
    }).not.toThrow();
  });
});

