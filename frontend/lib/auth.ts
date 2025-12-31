import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export async function getUserById(id: string) {
  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user[0] || null;
}

export async function getUserByEmail(email: string) {
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user[0] || null;
}

export async function createUser(data: {
  id: string;
  email: string;
  name?: string;
  image?: string;
}) {
  const [user] = await db.insert(users).values({
    id: data.id,
    email: data.email,
    name: data.name,
    image: data.image,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return user;
}

