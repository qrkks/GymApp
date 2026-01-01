import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function getCurrentUser() {
  try {
    const session = await auth();
    return session?.user || null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }
  return user as { id: string; email: string; name?: string };
}

