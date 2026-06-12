import pool from '~/server/config/db';

export default defineEventHandler(async (event) => {
  // 認証
  const authenticatedUser = getAuthenticatedUser(event);

  const { is_viewed, notificationId } = await readBody<{
    is_viewed: boolean;
    notificationId: string;
  }>(event);

  if (!notificationId || typeof is_viewed !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '入力された値が正しくありません。' },
    });
  }

  const updateQuery = `
    UPDATE user_notifications
    SET is_viewed = $1, viewed_at = NOW()
    WHERE user_id = $2 AND announcement_id = $3
  `;

  const insertQuery = `
    INSERT INTO user_notifications (is_viewed, viewed_at, user_id, announcement_id)
    VALUES ($1, NOW(), $2, $3)
  `;

  try {
    const updateResult = await pool.query(updateQuery, [
      is_viewed,
      authenticatedUser.user_id,
      notificationId,
    ]);

    if (updateResult.rowCount === 0) {
      await pool.query(insertQuery, [
        is_viewed,
        authenticatedUser.user_id,
        notificationId,
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error(
      '[already-read]Error updating or inserting notification:',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '通知の更新中にエラーが発生しました。' },
    });
  }
});
