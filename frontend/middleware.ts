/**
 * Next.js Middleware
 * 实现路由级别的认证保护
 * 使用 Edge Runtime 兼容的方式检查认证状态
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // 使用 getToken 检查 JWT token（Edge Runtime 兼容）
  // getToken 只检查 cookie 中的 token，不需要访问数据库
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  // 如果未登录（没有 token），重定向到登录页面
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    // 保存原始 URL，登录后可以跳转回来
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 已登录（有 token），放行
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

