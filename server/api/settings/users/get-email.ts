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
      `[get-email] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const query = `
      SELECT user_email 
      FROM users 
      WHERE user_id = $1 AND facility_code = $2;
    `;
  const values = [authenticatedUser.user_id, facilityCode];

  let result;
  try {
    result = await pool.query(query, values);
  } catch (error) {
    console.error('[get-email]Error occurred while fetching user_id', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'ユーザー情報の取得に失敗しました。' },
    });
  }

  if (result.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: 'ユーザー情報が見つかりません。' },
    });
  }

  return { user_email: result.rows[0].user_email };
});
