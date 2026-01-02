/**
 * User API Route (profile) 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { NextRequest } from 'next/server';
import { PUT } from '../route';
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

describe('PUT /api/user/profile', () => {
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

  it('应该成功更新用户名并返回有效的 JSON', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ username: 'newusername' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('username', 'newusername');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该成功更新邮箱并返回有效的 JSON', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ email: 'newemail@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('email', 'newemail@example.com');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理验证错误（空请求体）并返回 400 错误', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理验证错误（无效邮箱）并返回 400 错误', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ email: 'invalid-email' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理未授权请求并返回 401 错误', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ username: 'newusername' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request);

    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });
});

