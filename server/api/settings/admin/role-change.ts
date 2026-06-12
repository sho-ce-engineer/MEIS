import pool from '~/server/config/db';
//ToDo
//次回の機能修正の際に、権限変更処理の見直しを行う

interface RoleChangeRequestBody {
  target_user_id: string;
  new_user_role: string;
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
      `[role-change] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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

  const body = await readBody<RoleChangeRequestBody>(event);
  const { target_user_id, new_user_role } = body;

  const ALLOWED_ROLES = ['admin', 'general'];

  if (!target_user_id || !new_user_role) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '必須項目が不足しています。' },
    });
  }

  if (!ALLOWED_ROLES.includes(new_user_role)) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '無効なユーザー権限です。' },
    });
  }

  try {
    await pool.query('UPDATE users SET user_role = $1 WHERE user_id = $2', [
      new_user_role,
      target_user_id,
    ]);
    return sendNoContent(event);
  } catch (error) {
    console.error('[role-change] Database error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }
});
