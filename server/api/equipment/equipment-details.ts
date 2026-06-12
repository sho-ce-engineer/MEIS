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
      `[equipment-details] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { equipment_id } = await readBody(event);

  if (!equipment_id) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: 'equipment_idは必須です。' },
    });
  }

  const query = `
      SELECT equipment_name, equipment_model, equipment_serial_number, equipment_type
      FROM equipment_ledger
      WHERE equipment_id = $1 AND facility_code = $2
    `;
  const values = [equipment_id, facilityCode];

  let result;

  try {
    result = await pool.query(query, values);
  } catch (error) {
    console.error(
      `[equipment-details] Database query error for equipment_id: ${equipment_id}, facility_code: ${facilityCode}`,
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
      data: { message: '該当するデータが見つかりませんでした。' },
    });
  }

  return result.rows[0];
});
