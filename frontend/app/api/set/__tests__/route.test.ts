/**
 * Set API Route 集成测试
 * 测试 HTTP 请求/响应、JSON 序列化、错误处理等集成问题
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import * as exerciseCommands from '@domain/exercise/repository/commands/exercise.repository';
import * as workoutCommands from '@domain/workout/repository/commands/workout.repository';
import { users, bodyParts, exercises, workouts } from '@/lib/db/schema';

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

describe('GET /api/set', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);
  let testWorkoutDate: string;

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(workouts);
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
    const exercise = await exerciseCommands.insertExercise(testUserId, {
      name: 'Bench Press',
      bodyPartId: bodyPart.id,
    });

    testWorkoutDate = '2025-01-01';
    await workoutCommands.insertWorkout(testUserId, {
      date: testWorkoutDate,
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

  it('应该处理缺少必需参数并返回 400 错误', async () => {
    const request = new NextRequest('http://localhost/api/set', {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理缺少 workout_date 参数并返回 400 错误', async () => {
    const request = new NextRequest('http://localhost/api/set?exercise_name=Bench Press', {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理缺少 exercise_name 参数并返回 400 错误', async () => {
    const request = new NextRequest(`http://localhost/api/set?workout_date=${testWorkoutDate}`, {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该处理未授权请求并返回 401 错误', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/set?workout_date=${testWorkoutDate}&exercise_name=Bench Press`,
      { method: 'GET' }
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it('应该确保所有错误响应都是有效的 JSON（不会返回 HTML）', async () => {
    const scenarios = [
      { url: 'http://localhost/api/set', expectedStatus: 400 },
      { url: 'http://localhost/api/set?workout_date=2025-01-01', expectedStatus: 400 },
      { url: 'http://localhost/api/set?exercise_name=Bench Press', expectedStatus: 400 },
    ];

    for (const scenario of scenarios) {
      const request = new NextRequest(scenario.url, { method: 'GET' });

      const response = await GET(request);

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

