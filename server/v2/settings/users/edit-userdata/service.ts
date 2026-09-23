import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export interface UpdateUserDataParams {
  userId: string;
  facilityCode: string;
  userName: string;
  userEmail: string;
  password?: string;
}

export const updateUserData = async ({
  userId,
  facilityCode,
  userName,
  userEmail,
  password,
}: UpdateUserDataParams) => {
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  const [row] = await db
    .update(users)
    .set({
      userName,
      userEmail,
      password: hashedPassword,
    })
    .where(and(eq(users.userId, userId), eq(users.facilityCode, facilityCode)))
    .returning({ userName: users.userName, userEmail: users.userEmail });
  return row;
};
