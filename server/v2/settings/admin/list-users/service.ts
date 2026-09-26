import { asc, count, desc, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const sortColumnMap = {
  userName: users.userName,
  userRole: users.userRole,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

export interface ListUsersParams {
  facilityCode: string;
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortOrder: SortOrder;
}

export const listUsers = async ({
  facilityCode,
  page,
  itemsPerPage,
  sortRow,
  sortOrder,
}: ListUsersParams) => {
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const rows = await db
    .select({
      userId: users.userId,
      userName: users.userName,
      userRole: users.userRole,
    })
    .from(users)
    .where(eq(users.facilityCode, facilityCode))
    .orderBy(orderFn(sortColumnMap[sortRow]))
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage);

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.facilityCode, facilityCode));

  return { items: rows, total };
};
