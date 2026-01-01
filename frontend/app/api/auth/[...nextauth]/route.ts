import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const handler = NextAuth(authOptions);

export const { GET, POST } = handler.handlers;

