import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export interface DeleteUserParams {
  facilityCode: string;
  targetUserId: string;
}

export const deleteUser = async ({
  facilityCode,
  targetUserId,
}: DeleteUserParams) => {
  const [row] = await db
    .delete(users)
    .where(
      and(eq(users.facilityCode, facilityCode), eq(users.userId, targetUserId)),
    )
    .returning();
  return row;
};
