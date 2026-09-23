import { and, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export interface UpdateUserRoleParams {
  facilityCode: string;
  targetUserId: string;
  newUserRole: string;
}

export const updateUserRole = async ({
  facilityCode,
  targetUserId,
  newUserRole,
}: UpdateUserRoleParams) => {
  const [row] = await db
    .update(users)
    .set({
      userRole: newUserRole,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(
      and(eq(users.userId, targetUserId), eq(users.facilityCode, facilityCode)),
    )
    .returning();
  return row;
};
