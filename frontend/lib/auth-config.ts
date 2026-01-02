import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/auth';
import * as userUseCase from '@domain/user/application/user.use-case';

// NextAuth v5 requires AUTH_SECRET
// Try multiple environment variable names
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// Don't fail the build if secret is missing during build/dev.
// Enforce only at runtime in production to avoid breaking `pnpm run build`.
if (!secret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing AUTH_SECRET environment variable. Please set AUTH_SECRET in your runtime environment.'
    );
  } else {
    // During build or non-production environments, warn and continue.
    // This prevents Next.js build-time data collection from failing.
    // eslint-disable-next-line no-console
    console.warn(
      'AUTH_SECRET not set — continuing build. Ensure AUTH_SECRET is provided at runtime in production.'
    );
  }
}

export const authOptions = {
  secret: secret,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // 类型断言：确保 identifier 和 password 是 string 类型
        const identifier = String(credentials.identifier);
        const password = String(credentials.password);

        // 验证用户密码（支持用户名或邮箱）
        const result = await userUseCase.verifyPassword(
          identifier,
          password
        );

        if (!result.success) {
          return null;
        }

        return {
          id: result.data.id,
          email: result.data.email || '', // 确保 email 不为 null
          name: result.data.username, // NextAuth 使用 name 字段，我们映射 username
        };
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

