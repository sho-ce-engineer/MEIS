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
      `[inspection-types] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { equipmentModel } = await readBody<{ equipmentModel: string }>(event);

  if (!equipmentModel) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '機器型番の選択が必須です。' },
    });
  }

  try {
    const result = await pool.query<{ inspection_type: string }>(
      'SELECT DISTINCT inspection_type FROM inspection_items WHERE equipment_model = $1 AND facility_code = $2',
      [equipmentModel, facilityCode],
    );

    return result.rows;
  } catch (error) {
    console.error(
      '[inspection-types] Error occurred while fetching inspection types:',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Server Error',
      data: { message: 'サーバーエラーが発生しました' },
    });
  }
});
