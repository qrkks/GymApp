/**
 * BodyPart API Route (Single Resource) 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '../route';
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { users, bodyParts } from '@/lib/db/schema';

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

describe('PATCH /api/body-part/[id]', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);
  let testBodyPartId: number;

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(bodyParts);
    await testDb.delete(users);

    // 创建测试用户（使用唯一的用户名和邮箱）
    await userCommands.insertUser({
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
    });

    // 创建测试数据
    const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
    testBodyPartId = bodyPart.id;

    // Mock requireAuth
    (requireAuth as jest.Mock).mockResolvedValue({ id: testUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestDb(__filename);
  });

  describe('PATCH /api/body-part/[id]', () => {
    it('应该成功更新训练部位名称并返回有效的 JSON', async () => {
      const request = new NextRequest(`http://localhost/api/body-part/${testBodyPartId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body_part_name: 'Upper Chest' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testBodyPartId.toString() },
      });

      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await response.json();
      expect(body).toHaveProperty('name', 'Upper Chest');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理无效的 ID 并返回 400 错误', async () => {
      const request = new NextRequest('http://localhost/api/body-part/invalid', {
        method: 'PATCH',
        body: JSON.stringify({ body_part_name: 'New Name' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: 'invalid' },
      });

      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理不存在的训练部位并返回 404 错误', async () => {
      const request = new NextRequest('http://localhost/api/body-part/99999', {
        method: 'PATCH',
        body: JSON.stringify({ body_part_name: 'New Name' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: '99999' },
      });

      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理验证错误并返回 400 错误', async () => {
      const request = new NextRequest(`http://localhost/api/body-part/${testBodyPartId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body_part_name: '' }), // 空名称
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testBodyPartId.toString() },
      });

      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/body-part/${testBodyPartId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body_part_name: 'New Name' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testBodyPartId.toString() },
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });
  });

  describe('DELETE /api/body-part/[id]', () => {
    it('应该成功删除训练部位并返回有效的 JSON', async () => {
      const request = new NextRequest(`http://localhost/api/body-part/${testBodyPartId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: { id: testBodyPartId.toString() },
      });

      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await response.json();
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理无效的 ID 并返回 400 错误', async () => {
      const request = new NextRequest('http://localhost/api/body-part/invalid', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: { id: 'invalid' },
      });

      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理不存在的训练部位并返回 404 错误', async () => {
      const request = new NextRequest('http://localhost/api/body-part/99999', {
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

      const request = new NextRequest(`http://localhost/api/body-part/${testBodyPartId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: { id: testBodyPartId.toString() },
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该确保所有错误响应都是有效的 JSON（不会返回 HTML）', async () => {
      const scenarios = [
        { id: 'invalid', expectedStatus: 400 },
        { id: '99999', expectedStatus: 404 },
      ];

      for (const scenario of scenarios) {
        const request = new NextRequest(`http://localhost/api/body-part/${scenario.id}`, {
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

