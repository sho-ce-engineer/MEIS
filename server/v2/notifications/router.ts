import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { markAsReadRequestSchema } from '~/server/v2/notifications/already-read/domain';
import { markAsRead } from '~/server/v2/notifications/already-read/service';
import { listAnnouncementsRequestSchema } from '~/server/v2/notifications/announcements/domain';
import { listAnnouncements } from '~/server/v2/notifications/announcements/service';
import { getUnreadCount } from './unread-count/service';

const app = new Hono<{ Variables: Variables }>();

app
  .post(
    '/announcements',
    zValidator('json', listAnnouncementsRequestSchema),
    async (c) => {
      const { user_id: userId } = c.get('jwtPayload');
      const { page, itemsPerPage, sortRow, sortOrder } = c.req.valid('json');

      try {
        const result = await listAnnouncements({
          page,
          itemsPerPage,
          sortRow,
          sortOrder,
          userId,
        });
        return c.json(result);
      } catch (error) {
        console.error('[announcements]Error fetching data:', error);
        throw new HTTPException(500, {
          message: 'データの取得に失敗しました。',
        });
      }
    },
  )
  .get('/unread-count', async (c) => {
    const { user_id: userId } = c.get('jwtPayload');

    try {
      const unreadCount = await getUnreadCount(userId);
      return c.json({ unreadCount });
    } catch (error) {
      console.error('[unread-count]Error fetching unread count:', error);
      throw new HTTPException(500, {
        message: '通知の読み込みに失敗しました。',
      });
    }
  })
  .post(
    '/already-read',
    zValidator('json', markAsReadRequestSchema),
    async (c) => {
      const { user_id: userId } = c.get('jwtPayload');
      const { is_viewed, notificationId } = c.req.valid('json');

      try {
        await markAsRead({
          userId,
          announcementId: notificationId,
          isViewed: is_viewed,
        });
        return c.json({ success: true });
      } catch (error) {
        console.error(
          '[already-read]Error updating or inserting notification:',
          error,
        );
        throw new HTTPException(500, {
          message: '通知の更新中にエラーが発生しました。',
        });
      }
    },
  );

export default app;
