/**
 * NextAuth v5 Edge-compatible 配置
 * 这个文件只包含 Edge Runtime 兼容的配置
 * 用于 middleware 和其他 Edge 环境
 */
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';

// NextAuth v5 requires AUTH_SECRET
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export default {
  secret: secret,
  // NextAuth v5: 在生产环境中信任代理（Traefik/反向代理）
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
  providers: [
    // CredentialsProvider 在 Edge Runtime 中需要延迟加载
    // 这里只定义配置，实际的 authorize 函数在 auth-config.ts 中
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize 函数在 Edge Runtime 中不会被调用（只在登录时调用）
      // 所以这里可以留空或返回 null
      async authorize() {
        // 这个函数在 Edge Runtime 中不会被调用
        // 实际的验证逻辑在 auth-config.ts 中
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    // 这些 callbacks 在 Edge Runtime 中主要用于读取 token
    // 实际的修改逻辑在 auth-config.ts 中
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  // 生产环境 Cookie 配置
  // NextAuth v5: Cookie 前缀从 'next-auth' 改为 'authjs'
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'lax' | 'none',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'lax' | 'none',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'lax' | 'none',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
} satisfies NextAuthConfig;

