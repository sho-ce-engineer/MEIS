import { and, eq, isNull } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export interface GetUserCredentialParams {
  email: string;
}

export const getUserCredential = async ({ email }: GetUserCredentialParams) => {
  const [row] = await db
    .select({ userId: users.userId, password: users.password })
    .from(users)
    .where(and(eq(users.userEmail, email), isNull(users.deletedAt)));

  return row;
};
