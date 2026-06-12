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
      `[equipment-id] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
      SELECT equipment_id
      FROM equipment_ledger
      WHERE facility_code = $1
    `;
  const values = [facilityCode];

  let result;

  try {
    result = await pool.query(query, values);
  } catch (error) {
    console.error(
      `[equipment-id] Database query error for facility_code: ${facilityCode}`,
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }

  if (result.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '機器が見つかりません。' },
    });
  }

  return result.rows.map((row) => row.equipment_id);
});
