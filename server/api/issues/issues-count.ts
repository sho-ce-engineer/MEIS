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
      `[issues-count] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  try {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(reported_date) FROM issues 
            WHERE facility_code = $1 
            AND reported_date::date = CURRENT_DATE`,
      [facilityCode],
    );
    const count = parseInt(result.rows[0].count, 10);
    return { count };
  } catch (error) {
    console.error('[issues-count]Database error for', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '報告数の取得中にエラーが発生しました。' },
    });
  }
});
