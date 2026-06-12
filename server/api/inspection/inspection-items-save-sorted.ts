import pool from '~/server/config/db';

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証ユーザーの施設コードを取得
  const authenticatedUserQuery = `
    SELECT facility_code FROM users
    WHERE user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[inspection-items-save-sorted] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { updatedItems } = await readBody(event);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const category in updatedItems) {
      const items = updatedItems[category];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `
          UPDATE inspection_items
          SET inspection_sort_number = $1
          WHERE inspection_item_id = $2 
          AND facility_code = $3`,
          [i + 1, item.inspection_item_id, facilityCode],
        );
      }
    }

    await client.query('COMMIT');
    return sendNoContent(event);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[inspection-items-save-sorted] Transaction failed:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目の並び順の保存中にエラーが発生しました。' },
    });
  } finally {
    client.release();
  }
});
