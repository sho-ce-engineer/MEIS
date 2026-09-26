import { formatInTimeZone } from 'date-fns-tz';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { announcements, userNotifications } from '~/server/db/schema';

const sortColumnMap = {
  createdAt: announcements.createdAt,
  importanceLevel: announcements.importanceLevel,
  title: announcements.title,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

export interface ListAnnouncementsParams {
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortOrder: SortOrder;
  userId: string;
}

export async function listAnnouncements({
  page,
  itemsPerPage,
  sortRow,
  sortOrder,
  userId,
}: ListAnnouncementsParams) {
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      message: announcements.message,
      importanceLevel: announcements.importanceLevel,
      isActive: announcements.isActive,
      createdAt: announcements.createdAt,
      audience: announcements.audience,
      isViewed: sql<boolean>`COALESCE(${userNotifications.isViewed}, FALSE)`,
      viewedAt: userNotifications.viewedAt,
    })
    .from(announcements)
    .leftJoin(
      userNotifications,
      and(
        eq(userNotifications.announcementId, announcements.id),
        eq(userNotifications.userId, userId),
      ),
    )
    .orderBy(orderFn(sortColumnMap[sortRow]))
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage);

  const formattedRows = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt
      ? formatInTimeZone(row.createdAt, 'Asia/Tokyo', 'yyyy-MM-dd')
      : row.createdAt,
  }));

  const [{ total }] = await db.select({ total: count() }).from(announcements);

  return { items: formattedRows, total };
}
