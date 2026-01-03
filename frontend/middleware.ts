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
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    console.error('[Middleware] AUTH_SECRET 未设置，无法验证 token');
    // 在生产环境中，如果没有 secret，应该阻止访问
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '服务器配置错误：AUTH_SECRET 未设置' },
        { status: 500 }
      );
    }
  }

  // NextAuth v5 在生产环境使用 secure cookie 时，Cookie 名称可能带有 __Secure- 前缀
  // 但 getToken 应该能自动检测，我们先尝试自动检测
  const isProduction = process.env.NODE_ENV === 'production';
  
  // NextAuth v5 的 getToken 需要正确的配置
  // 尝试多种方式读取 token，以兼容不同的浏览器和配置
  let token = null;
  
  // 方式1: 让 getToken 自动检测（推荐方式）
  token = await getToken({
    req: request,
    secret: secret,
    secureCookie: isProduction,
  });

  // 方式2: 如果自动检测失败，明确指定 Cookie 名称
  if (!token) {
    token = await getToken({
      req: request,
      secret: secret,
      secureCookie: isProduction,
      cookieName: 'next-auth.session-token',
    });
  }

  // 方式3: 如果还是失败，尝试不同的 secureCookie 设置（某些浏览器可能需要）
  if (!token && isProduction) {
    token = await getToken({
      req: request,
      secret: secret,
      secureCookie: false, // 尝试不使用 secure
      cookieName: 'next-auth.session-token',
    });
  }

  // 如果未登录（没有 token），重定向到登录页面
  if (!token) {
    // 记录详细的调试信息
    const allCookies = request.cookies.getAll();
    const cookieNames = allCookies.map(c => c.name);
    const authCookies = allCookies.filter(c => 
      c.name.includes('next-auth') || c.name.includes('auth') || c.name.includes('session')
    );
    const hasAuthCookie = authCookies.length > 0;
    
    // 输出所有 Cookie 的详细信息（用于诊断）
    const cookieDetails = authCookies.map(c => ({
      name: c.name,
      value: c.value ? `${c.value.substring(0, 20)}...` : 'empty',
      hasValue: !!c.value,
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] 未找到 token，重定向到登录页', {
        pathname,
        allCookies: cookieNames,
        authCookies: cookieDetails,
        hasAuthCookie,
        isProduction,
        userAgent: request.headers.get('user-agent')?.substring(0, 50),
      });
    } else {
      // 生产环境也记录详细信息以便诊断
      console.warn('[Middleware] 未找到 token', {
        pathname,
        hasAuthCookie,
        authCookies: cookieDetails,
        cookieCount: cookieNames.length,
        isProduction,
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

