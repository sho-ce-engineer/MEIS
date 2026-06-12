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
      `[inspection-results-count] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
  const { jpyDate } = body;

  if (!jpyDate) {
    console.error('[inspection-results-count]Error fetching JPYData.');
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '日付が取得できませんでした。' },
    });
  }

  try {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT inspection_date) FROM inspection_results 
            WHERE facility_code = $1 
            AND inspection_date::date = $2`,
      [facilityCode, jpyDate],
    );
    const count = parseInt(result.rows[0].count, 10);
    return { count };
  } catch (error) {
    console.error(
      '[inspection-results-count]Error occurred while fetching Inspection Result.',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検結果のカウント処理中にエラーが発生しました。' },
    });
  }
});
