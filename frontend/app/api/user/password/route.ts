// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';

/**
 * 修改密码 API Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import * as userUseCase from '@domain/user/application/user.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '旧密码不能为空'),
  newPassword: z.string().min(6, '新密码长度至少为 6 个字符'),
});

/**
 * PUT /api/user/password - 修改当前用户密码
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
    const validationResult = changePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { oldPassword, newPassword } = validationResult.data;

    const result = await userUseCase.changePassword(
      user.id,
      oldPassword,
      newPassword
    );
    const response = toHttpResponse(result);

    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { error: '修改密码失败，服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

