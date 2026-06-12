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
      `[equipment-models] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { equipmentType } = await readBody<{ equipmentType: string }>(event);

  if (!equipmentType) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '機器種類の選択が必須です。' },
    });
  }

  const query = `
        SELECT DISTINCT equipment_model
        FROM equipment_ledger
        WHERE equipment_type = $1 AND facility_code = $2
      `;

  try {
    const result = await pool.query<{ equipment_model: string }>(query, [
      equipmentType,
      facilityCode,
    ]);

    return result.rows;
  } catch (error) {
    console.error(
      '[equipment-models] Error occurred while fetching equipment models:',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '機器型番の取得中にエラーが発生しました。' },
    });
  }
});
