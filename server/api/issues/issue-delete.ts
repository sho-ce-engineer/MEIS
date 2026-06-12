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
      `[issue-delete] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const body = await readBody(event);
  const issue_id: string = body.issue_id;

  if (!issue_id || issue_id.length === 0) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '削除対象のデータが見つかりません。' },
    });
  }

  const deleteQuery = `
      DELETE FROM issues
      WHERE facility_code = $1
      AND issue_id = $2
    `;

  try {
    await pool.query(deleteQuery, [facilityCode, issue_id]);
    return sendNoContent(event);
  } catch (error) {
    console.error('[issue-delete] Database error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }
});
