import { db } from '~/server/db';
import { invitations } from '~/server/db/schema';

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
