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
      `[inspection-results-delete] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
  const resultIds = body.result_ids;

  if (!resultIds || resultIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '削除する点検結果が見つかりません。' },
    });
  }

  const deleteQuery = `
      DELETE FROM inspection_results
      WHERE facility_code = $1
      AND result_id = ANY($2::text[])
    `;

  try {
    await pool.query(deleteQuery, [facilityCode, resultIds]);

    return sendNoContent(event);
  } catch (error) {
    console.error(
      '[inspection-results-delete]Error occurred while deleting Inspection Result Data.',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検結果の削除処理中にエラーが発生しました。' },
    });
  }
});
