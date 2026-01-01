export const runtime = 'nodejs';
/**
 * 用户注册 API Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as userUseCase from '@domain/user/application/user.use-case';
import { toHttpResponse, getStatusCode } from '@domain/shared/error-types';

const signupSchema = z.object({
  email: z.string().email('邮箱格式不正确，请输入有效的邮箱地址'),
  username: z.string().min(1, '用户名不能为空，请输入用户名'),
  password: z.string().min(6, '密码长度至少为 6 个字符'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, username, password } = validationResult.data;

    // 使用邮箱作为用户 ID
    const userId = email;

    // 创建用户
    const result = await userUseCase.createUser({
      id: userId,
      email,
      username,
      password,
    });

    if (!result.success) {
      const httpResponse = toHttpResponse(result);
      return NextResponse.json(
        httpResponse.body,
        { status: httpResponse.status }
      );
    }

    return NextResponse.json(
      { message: 'User created successfully', user: result.data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('注册 API 错误:', error);
    return NextResponse.json(
      { error: '注册失败，服务器内部错误，请稍后重试' },
      { status: getStatusCode('INTERNAL_ERROR') }
    );
  }
}

