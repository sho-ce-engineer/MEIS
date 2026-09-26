import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { facilities, users } from '~/server/db/schema';

export interface GetSessionUserParams {
  userId: string;
}

export const getSessionUser = async ({ userId }: GetSessionUserParams) => {
  const [row] = await db
    .select({
      userId: users.userId,
      userEmail: users.userEmail,
      userName: users.userName,
      userRole: users.userRole,
      facilityCode: users.facilityCode,
      facilityName: facilities.facilityName,
    })
    .from(users)
    .leftJoin(facilities, eq(users.facilityCode, facilities.facilityCode))
    .where(eq(users.userId, userId));

  return row;
};
