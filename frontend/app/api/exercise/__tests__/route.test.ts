/**
 * Exercise API Route 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import * as exerciseCommands from '@domain/exercise/repository/commands/exercise.repository';
import { users, bodyParts, exercises } from '@/lib/db/schema';

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

describe('Exercise API Routes', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);
  let testBodyPartId: number;

  beforeEach(async () => {
    // 清理数据库（按依赖顺序）
    await testDb.delete(exercises);
    await testDb.delete(bodyParts);
    await testDb.delete(users);

    // 创建测试用户（必须先创建，使用唯一的用户名和邮箱）
    await userCommands.insertUser({
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
    });

    // 创建测试数据
    const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
    testBodyPartId = bodyPart.id;

    // 创建测试动作（在用户和身体部位创建之后）
    const exercise = await exerciseCommands.insertExercise(testUserId, {
      name: 'Bench Press',
      bodyPartId: bodyPart.id,
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

  describe('GET /api/exercise', () => {
    it('应该成功获取训练动作列表并返回有效的 JSON', async () => {
      const request = new NextRequest('http://localhost/api/exercise', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该支持按身体部位名称过滤', async () => {
      const request = new NextRequest('http://localhost/api/exercise?body_part_name=Chest', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/exercise', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });
  });

  describe('POST /api/exercise', () => {
    it('应该成功创建训练动作并返回有效的 JSON', async () => {
      const request = new NextRequest('http://localhost/api/exercise', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Incline Bench Press',
          description: 'Upper chest exercise',
          body_part_id: testBodyPartId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await response.json();
      expect(body).toHaveProperty('name', 'Incline Bench Press');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理验证错误并返回 400 错误', async () => {
      const request = new NextRequest('http://localhost/api/exercise', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // 空名称
          body_part_id: testBodyPartId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理不存在的身体部位并返回 404 错误', async () => {
      const request = new NextRequest('http://localhost/api/exercise', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Exercise',
          body_part_id: 99999, // 不存在的身体部位
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/exercise', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Exercise',
          body_part_id: testBodyPartId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });
  });

  describe('DELETE /api/exercise', () => {
    it('应该成功删除所有训练动作并返回有效的 JSON', async () => {
      const response = await DELETE();

      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await response.json();
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const response = await DELETE();

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });
  });
});

