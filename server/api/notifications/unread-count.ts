import pool from '~/server/config/db';

export default defineEventHandler(async (event) => {
  // 認証
  const authenticatedUser = getAuthenticatedUser(event);

  const query = `
    SELECT COUNT(a.id) AS unread_count
    FROM announcements a
    LEFT JOIN user_notifications un ON a.id = un.announcement_id AND un.user_id = $1
    WHERE un.is_viewed = FALSE OR un.id IS NULL
  `;

  try {
    const result = await pool.query(query, [authenticatedUser.user_id]);
    const unreadCount = result.rows[0].unread_count;
    return { unreadCount };
  } catch (error) {
    console.error('[unread-count]Error fetching unread count:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '通知の読み込みに失敗しました。' },
    });
  }
});
