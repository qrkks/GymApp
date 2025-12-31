import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail, createUser } from '@/lib/auth';

// NextAuth v5 requires AUTH_SECRET
// Try multiple environment variable names
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!secret) {
  throw new Error(
    'Missing AUTH_SECRET environment variable. ' +
    'Please set AUTH_SECRET in your .env.local file. ' +
    'You can generate one using: openssl rand -base64 32'
  );
}

export const authOptions = {
  secret: secret,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        // For now, we'll use a simple email-based auth
        // In production, you should implement proper password hashing
        let user = await getUserByEmail(credentials.email);

        if (!user) {
          // Auto-create user if doesn't exist (for development)
          // In production, you should have a proper registration flow
          user = await createUser({
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
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
};

const handler = NextAuth(authOptions);

export const { handlers, auth } = handler;

export const { GET, POST } = handlers;

