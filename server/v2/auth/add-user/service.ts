import bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { facilities, invitations, users } from '~/server/db/schema';

export interface GetUserByEmailParams {
  email: string;
}

export const getUserByEmail = async ({ email }: GetUserByEmailParams) => {
  const [row] = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.userEmail, email));

  return row;
};

export interface GetInvitationParams {
  inviteCode: string;
}

export const getInvitation = async ({ inviteCode }: GetInvitationParams) => {
  const [row] = await db
    .select({
      email: invitations.email,
      facilityCode: invitations.facilityCode,
      userRole: invitations.userRole,
      expiresAt: invitations.expiresAt,
      facilityName: facilities.facilityName,
    })
    .from(invitations)
    .leftJoin(facilities, eq(invitations.facilityCode, facilities.facilityCode))
    .where(eq(invitations.inviteCode, inviteCode));

  return row;
};

export interface AddFacilityParams {
  facilityCode: string;
  facilityName: string;
}

export const addFacility = async ({
  facilityCode,
  facilityName,
}: AddFacilityParams) => {
  await db
    .insert(facilities)
    .values({ facilityCode, facilityName })
    .onConflictDoNothing({ target: facilities.facilityCode });
};

export interface AddUserParams {
  userId: string;
  userEmail: string;
  password: string;
  userName: string;
  facilityCode: string;
  userRole: string;
}

export const addUser = async ({
  userId,
  userEmail,
  password,
  userName,
  facilityCode,
  userRole,
}: AddUserParams) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [row] = await db
    .insert(users)
    .values({
      userId,
      userEmail,
      password: hashedPassword,
      userName,
      facilityCode,
      userRole,
    })
    .returning({
      userId: users.userId,
      userEmail: users.userEmail,
      userName: users.userName,
      facilityCode: users.facilityCode,
      userRole: users.userRole,
    });

  return row;
};

export interface UpdateInvitationAsUsedParams {
  inviteCode: string;
}

export const updateInvitationAsUsed = async ({
  inviteCode,
}: UpdateInvitationAsUsedParams) => {
  await db
    .update(invitations)
    .set({ inviteCode: sql`CONCAT('USED_', ${invitations.inviteCode})` })
    .where(eq(invitations.inviteCode, inviteCode));
};
