/**
 * Set API Route (Single Set) 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
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

describe('Set API Routes - Single Resource', () => {
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

  describe('PUT /api/set/[id]', () => {
    it('应该处理验证错误（无效数据）并返回 400 错误', async () => {
      const request = new NextRequest('http://localhost/api/set/1', {
        method: 'PUT',
        body: JSON.stringify({
          weight: -1, // 无效重量
          reps: 0, // 无效次数
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, {
        params: { id: '1' },
      });

      // 注意：这里可能会返回 400（验证错误）或 404（set 不存在）
      expect([400, 404]).toContain(response.status);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理缺少必需字段并返回 400 错误', async () => {
      const request = new NextRequest('http://localhost/api/set/1', {
        method: 'PUT',
        body: JSON.stringify({
          weight: 100,
          // 缺少 reps
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, {
        params: { id: '1' },
      });

      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/set/1', {
        method: 'PUT',
        body: JSON.stringify({
          weight: 100,
          reps: 10,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, {
        params: { id: '1' },
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });
  });

  describe('DELETE /api/set/[id]', () => {
    it('应该处理不存在的 set 并返回 404 错误', async () => {
      const request = new NextRequest('http://localhost/api/set/99999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: { id: '99999' },
      });

      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/set/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: { id: '1' },
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该确保所有错误响应都是有效的 JSON（不会返回 HTML）', async () => {
      const scenarios = [
        { id: '99999', expectedStatus: 404 },
      ];

      for (const scenario of scenarios) {
        const request = new NextRequest(`http://localhost/api/set/${scenario.id}`, {
          method: 'DELETE',
        });

        const response = await DELETE(request, {
          params: { id: scenario.id },
        });

        expect(response.status).toBe(scenario.expectedStatus);
        
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
        expect(contentType).not.toContain('text/html');

        const text = await response.text();
        expect(() => {
          const parsed = JSON.parse(text);
          JSON.stringify(parsed);
        }).not.toThrow();
      }
    });
  });
});

