import pool from '~/server/config/db';
// TODO: Phase5対応
// 紐づく点検結果がある場合は論理削除(deleted_at)、ない場合は物理削除する設計に変更する
// 現状は外部キー制約により点検結果が存在する場合は削除不可

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
      `[inspection-item-delete] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
  const inspectionItemId = body.inspection_item_id;

  if (!inspectionItemId || inspectionItemId.length === 0) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '削除する点検項目が見つかりません。' },
    });
  }

  const deleteQuery = `
      DELETE FROM inspection_items
      WHERE facility_code = $1
      AND inspection_item_id = $2
    `;

  try {
    await pool.query(deleteQuery, [facilityCode, inspectionItemId]);

    return sendNoContent(event);
  } catch (error) {
    console.error(
      '[inspection-item-delete]Error occurred while deleting Inspection Result Data.',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目の削除処理中にエラーが発生しました。' },
    });
  }
});
