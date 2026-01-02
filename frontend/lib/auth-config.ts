import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/auth';
import * as userUseCase from '@domain/user/application/user.use-case';

// NextAuth v5 requires AUTH_SECRET
// Try multiple environment variable names
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// Do not throw during build; warn if missing and require it to be set at runtime.
if (!secret) {
  // eslint-disable-next-line no-console
  console.warn(
    'AUTH_SECRET is not set. Ensure AUTH_SECRET is provided at runtime (docker-compose / environment) for production.'
  );
}

export const authOptions = {
  secret: secret,
  // NextAuth v5: 在生产环境中信任代理（Traefik/反向代理）
  // 如果设置了 AUTH_TRUST_HOST=true，则信任所有主机
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          console.warn('[NextAuth] authorize: 缺少凭证');
          return null;
        }

        // 类型断言：确保 identifier 和 password 是 string 类型
        const identifier = String(credentials.identifier);
        const password = String(credentials.password);

        try {
          // 验证用户密码（支持用户名或邮箱）
          const result = await userUseCase.verifyPassword(
            identifier,
            password
          );

          if (!result.success) {
            console.warn(`[NextAuth] authorize: 密码验证失败 - ${result.error?.message || '未知错误'}`);
            return null;
          }

          console.log(`[NextAuth] authorize: 登录成功 - ${result.data.email || result.data.username}`);
          return {
            id: result.data.id,
            email: result.data.email || '', // 确保 email 不为 null
            name: result.data.username, // NextAuth 使用 name 字段，我们映射 username
          };
        } catch (error) {
          console.error('[NextAuth] authorize: 验证过程出错', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
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
};

const handler = NextAuth(authOptions);

export const { auth } = handler;

