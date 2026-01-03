/**
 * Next.js Middleware
 * 实现路由级别的认证保护
 * 使用 Edge Runtime 兼容的方式检查认证状态
 * NextAuth v5: 使用 auth() 函数而不是 getToken()
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-config';

/**
 * 需要登录才能访问的路径
 */
const protectedPaths = [
  '/workouts',
  '/exercise-library',
  '/user',
];

/**
 * 不需要登录就能访问的路径（公开路径）
 */
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
];

/**
 * 检查路径是否需要保护
 */
function isProtectedPath(pathname: string): boolean {
  // 检查是否是公开路径
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return false;
  }

  // 检查是否是 API 路径（API 路由有自己的认证逻辑）
  if (pathname.startsWith('/api/')) {
    return false;
  }

  // 检查是否是静态资源
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/fonts/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return false;
  }

  // 检查是否是需要保护的路径
  return protectedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 如果路径不需要保护，直接放行
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // NextAuth v5: 使用 auth() 函数检查认证状态
  // auth() 会自动处理 Cookie 读取和 token 验证
  const session = await auth();
  
  // 如果未登录（没有 session），重定向到登录页面
  if (!session) {
    // 记录详细的调试信息
    const allCookies = request.cookies.getAll();
    const cookieNames = allCookies.map(c => c.name);
    // NextAuth v5: Cookie 前缀改为 'authjs'
    const authCookies = allCookies.filter(c => 
      c.name.includes('authjs') || c.name.includes('auth') || c.name.includes('session')
    );
    const hasAuthCookie = authCookies.length > 0;
    
    // 输出所有 Cookie 的详细信息（用于诊断）
    const cookieDetails = authCookies.map(c => ({
      name: c.name,
      value: c.value ? `${c.value.substring(0, 20)}...` : 'empty',
      hasValue: !!c.value,
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] 未找到 session，重定向到登录页', {
        pathname,
        allCookies: cookieNames,
        authCookies: cookieDetails,
        hasAuthCookie,
        userAgent: request.headers.get('user-agent')?.substring(0, 50),
      });
    } else {
      // 生产环境也记录详细信息以便诊断
      console.warn('[Middleware] 未找到 session', {
        pathname,
        hasAuthCookie,
        authCookies: cookieDetails,
        cookieCount: cookieNames.length,
        isMobile: /Mobile|Android|iPhone|iPad/.test(request.headers.get('user-agent') || ''),
        // 输出所有 Cookie 名称以便诊断
        allCookieNames: cookieNames,
      });
    }
    
    const signInUrl = new URL('/auth/signin', request.url);
    // 保存原始 URL，登录后可以跳转回来
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 已登录（有 session），放行
  return NextResponse.next();
}

/**
 * 配置 middleware 匹配的路径
 * 只匹配需要检查的路径，提高性能
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 静态资源文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};

