import { and, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { userNotifications } from '~/server/db/schema';

export interface MarkAsReadParams {
  userId: string;
  announcementId: string;
  isViewed: boolean;
}

export async function markAsRead({
  userId,
  announcementId,
  isViewed,
}: MarkAsReadParams) {
  const updated = await db
    .update(userNotifications)
    .set({ isViewed, viewedAt: sql`NOW()` })
    .where(
      and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.announcementId, Number(announcementId)),
      ),
    )
    .returning({ id: userNotifications.id });

  if (updated.length === 0) {
    await db.insert(userNotifications).values({
      userId,
      announcementId: Number(announcementId),
      isViewed,
      viewedAt: sql`NOW()`,
    });
  }
}
