import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { getUnreadCount } from './unread-count/service';

const app = new Hono<{ Variables: Variables }>();

app.get('/unread-count', async (c) => {
  const { user_id: userId } = c.get('jwtPayload');

  try {
    const unreadCount = await getUnreadCount(userId);
    return c.json({ unreadCount });
  } catch (error) {
    console.error('[unread-count]Error fetching unread count:', error);
    throw new HTTPException(500, { message: '通知の読み込みに失敗しました。' });
  }
});

export default app;
