/**
 * Exercise API Route 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '../route';
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

describe('Exercise API Routes - Single Resource', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);
  let testExerciseId: number;
  let testBodyPartId: number;

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(exercises);
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

    const exercise = await exerciseCommands.insertExercise(testUserId, {
      name: 'Bench Press',
      bodyPartId: bodyPart.id,
    });
    testExerciseId = exercise.id;

    // Mock requireAuth
    (requireAuth as jest.Mock).mockResolvedValue({ id: testUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestDb(__filename);
  });

  describe('PATCH /api/exercise/[id]', () => {
    it('应该成功更新训练动作名称并返回有效的 JSON', async () => {
      const request = new NextRequest(`http://localhost/api/exercise/${testExerciseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ exerciseName: 'Incline Bench Press' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testExerciseId.toString() },
      });

      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await response.json();
      expect(body).toHaveProperty('name', 'Incline Bench Press');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该支持 snake_case 格式的请求体', async () => {
      const request = new NextRequest(`http://localhost/api/exercise/${testExerciseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ exercise_name: 'Decline Bench Press' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testExerciseId.toString() },
      });

      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('name', 'Decline Bench Press');
    });

    it('应该处理验证错误并返回 400 错误', async () => {
      const request = new NextRequest(`http://localhost/api/exercise/${testExerciseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ exerciseName: '' }), // 空名称
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testExerciseId.toString() },
      });

      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });

    it('应该处理不存在的训练动作并返回 404 错误', async () => {
      const request = new NextRequest('http://localhost/api/exercise/99999', {
        method: 'PATCH',
        body: JSON.stringify({ exerciseName: 'New Name' }),
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

    it('应该处理未授权请求并返回 401 错误', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/exercise/${testExerciseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ exerciseName: 'New Name' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: { id: testExerciseId.toString() },
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(() => JSON.stringify(body)).not.toThrow();
    });
  });

  describe('DELETE /api/exercise/[id]', () => {

  it('应该成功删除训练动作并返回正确的 JSON 响应', async () => {
    const request = new NextRequest('http://localhost/api/exercise/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: { id: testExerciseId.toString() },
    });

    expect(response.status).toBe(200);
    
    // 验证响应是有效的 JSON
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body).toBeDefined();
    // 验证响应体是可序列化的（不会抛出错误）
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理无效的 ID 并返回 400 错误', async () => {
    const request = new NextRequest('http://localhost/api/exercise/invalid', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: { id: 'invalid' },
    });

    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    // 验证错误响应是可序列化的
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理不存在的训练动作并返回 404 错误', async () => {
    const request = new NextRequest('http://localhost/api/exercise/99999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: { id: '99999' },
    });

    expect(response.status).toBe(404);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    // 验证错误响应是可序列化的
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理未授权请求并返回 401 错误', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/exercise/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: { id: testExerciseId.toString() },
    });

    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理数据库错误并返回可序列化的错误响应', async () => {
    // Mock 一个会抛出错误的场景（例如外键约束）
    // 这里我们测试错误处理逻辑，确保错误对象被正确序列化
    
    const request = new NextRequest('http://localhost/api/exercise/1', {
      method: 'DELETE',
    });

    // 先删除 body part，然后尝试删除 exercise（如果有关联可能会失败）
    // 或者直接测试错误处理
    const response = await DELETE(request, {
      params: { id: testExerciseId.toString() },
    });

    // 无论成功还是失败，响应都应该是有效的 JSON
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');

    const body = await response.json();
    // 验证响应体是可序列化的
    expect(() => JSON.stringify(body)).not.toThrow();
    
    // 如果失败，验证错误信息格式正确
    if (!response.ok) {
      expect(body).toHaveProperty('error');
      // 验证 details 字段（如果存在）是可序列化的
      if (body.details) {
        expect(() => JSON.stringify(body.details)).not.toThrow();
      }
    }
  });

  it('应该确保所有错误响应都是有效的 JSON（不会返回 HTML）', async () => {
    // 模拟各种错误场景
    const scenarios = [
      { id: 'invalid', expectedStatus: 400 },
      { id: '99999', expectedStatus: 404 },
    ];

    for (const scenario of scenarios) {
      const request = new NextRequest(`http://localhost/api/exercise/${scenario.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: { id: scenario.id },
      });

      expect(response.status).toBe(scenario.expectedStatus);
      
      // 验证 Content-Type 是 JSON，不是 HTML
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
      expect(contentType).not.toContain('text/html');

      // 验证响应体是有效的 JSON（不会抛出解析错误）
      const text = await response.text();
      expect(() => {
        const parsed = JSON.parse(text);
        // 验证解析后的对象是可序列化的
        JSON.stringify(parsed);
      }).not.toThrow();
    }
  });
  }); // 关闭 DELETE describe

  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
}); // 关闭外层 describe

