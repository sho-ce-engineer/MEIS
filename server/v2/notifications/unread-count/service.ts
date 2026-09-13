import { and, eq, isNull, or } from 'drizzle-orm';
import { db } from '~/server/db';
import { announcements, userNotifications } from '~/server/db/schema';

export async function getUnreadCount(userId: string) {
  const result = await db
    .select({ id: announcements.id })
    .from(announcements)
    .leftJoin(
      userNotifications,
      and(
        eq(userNotifications.announcementId, announcements.id),
        eq(userNotifications.userId, userId),
      ),
    )
    .where(
      or(eq(userNotifications.isViewed, false), isNull(userNotifications.id)),
    );

  return result.length;
}
