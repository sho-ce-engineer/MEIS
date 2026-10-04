import { and, eq, isNull } from 'drizzle-orm';
import { db } from '~/server/db';
import {
  inspectionResults,
  userNotifications,
  users,
} from '~/server/db/schema';

export interface DeleteUserParams {
  facilityCode: string;
  targetUserId: string;
}

export const deleteUser = async ({
  facilityCode,
  targetUserId,
}: DeleteUserParams) => {
  return await db.transaction(async (tx) => {
    const [account] = await tx
      .select({ targetUserId: users.userId })
      .from(users)
      .where(
        and(
          eq(users.userId, targetUserId),
          eq(users.facilityCode, facilityCode),
          isNull(users.deletedAt),
        ),
      )
      .for('update');

    if (!account) {
      return undefined;
    }

    const [inspectionHistory] = await tx
      .select({ targetUserId: inspectionResults.userId })
      .from(inspectionResults)
      .where(
        and(
          eq(inspectionResults.userId, targetUserId),
          eq(inspectionResults.facilityCode, facilityCode),
        ),
      )
      .limit(1);

    await tx
      .delete(userNotifications)
      .where(and(eq(userNotifications.userId, targetUserId)));

    if (inspectionHistory) {
      await tx
        .update(users)
        .set({ deletedAt: new Date().toISOString() })
        .where(
          and(
            eq(users.userId, targetUserId),
            eq(users.facilityCode, facilityCode),
          ),
        );

      return { deleteType: 'soft' as const };
    }

    await tx
      .delete(users)
      .where(
        and(
          eq(users.facilityCode, facilityCode),
          eq(users.userId, targetUserId),
        ),
      )
      .returning();
    return { deleteType: 'hard' as const };
  });
};
