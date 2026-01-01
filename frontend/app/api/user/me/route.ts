/**
 * 获取当前用户信息 API Route
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import * as userUseCase from '@domain/user/application/user.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

/**
 * GET /api/user/me - 获取当前登录用户信息
 */
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const result = await userUseCase.getCurrentUser(user.id);
    const response = toHttpResponse(result);

    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败，服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

