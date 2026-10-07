import { and, eq, isNull } from 'drizzle-orm';
import { db } from '~/server/db';
import { invitations, users } from '~/server/db/schema';

export interface GetInviterNameParams {
  userId: string;
  facilityCode: string;
}

export const getInviterName = async ({
  userId,
  facilityCode,
}: GetInviterNameParams) => {
  const [inviter] = await db
    .select({ userName: users.userName })
    .from(users)
    .where(
      and(
        eq(users.userId, userId),
        eq(users.facilityCode, facilityCode),
        isNull(users.deletedAt),
      ),
    );

  return inviter?.userName;
};

export interface AddInvitationParams {
  email: string;
  facilityCode: string;
  userRole: string;
  invitedByUserId: string;
  inviteCode: string;
}

export const addInvitation = async ({
  email,
  facilityCode,
  userRole,
  invitedByUserId,
  inviteCode,
}: AddInvitationParams) => {
  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 7,
  ).toISOString(); // 7日間有効

  const [rows] = await db
    .insert(invitations)
    .values({
      email,
      facilityCode,
      userRole,
      invitedByUserId,
      inviteCode,
      expiresAt,
    })
    .returning();

  return rows;
};
