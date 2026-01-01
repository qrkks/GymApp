/**
 * 更新用户资料 API Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import * as userUseCase from '@domain/user/application/user.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const updateProfileSchema = z.object({
  username: z.string().min(1, '用户名不能为空').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  image: z.string().url('头像链接格式不正确').optional().nullable(),
}).refine(
  (data) => data.username !== undefined || data.email !== undefined || data.image !== undefined,
  { message: '至少需要提供一个要更新的字段' }
);

/**
 * PUT /api/user/profile - 更新当前用户资料
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 验证请求数据
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    // 将 null 转换为 undefined 以匹配类型
    const updateData = {
      ...validationResult.data,
      image: validationResult.data.image ?? undefined,
    };
    const result = await userUseCase.updateUser(user.id, updateData);
    const response = toHttpResponse(result);

    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }
    console.error('更新用户资料失败:', error);
    return NextResponse.json(
      { error: '更新用户资料失败，服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

