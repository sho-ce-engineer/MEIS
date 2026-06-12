import pool from '~/server/config/db';
// TODO: Phase5で論理削除対応予定
// 現状は物理削除。inspection_resultsなど関連レコードがある場合は
// 外部キー制約エラーになる可能性がある。
// deleted_atカラムによる論理削除に変更すること。

interface UserDeleteRequestBody {
  target_user_id: string;
}

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証ユーザーの施設コードおよびユーザー権限を取得
  const authenticatedUserQuery = `
    SELECT
      facility_code,
      user_role
    FROM users
    WHERE user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[user-delete] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const userRole: string = AuthenticatedUserFacilityResult.rows[0].user_role;

  if (userRole !== 'admin') {
    throw createError({
      statusCode: 403,
      statusText: 'Forbidden',
      data: { message: '変更権限がありません。' },
    });
  }
  const { target_user_id } = await readBody<UserDeleteRequestBody>(event);

  if (!target_user_id) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '対象ユーザーが登録されていません。' },
    });
  }

  try {
    await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [
      target_user_id,
    ]);

    return sendNoContent(event);
  } catch (error) {
    console.error('[user-delete] Database error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }
});
