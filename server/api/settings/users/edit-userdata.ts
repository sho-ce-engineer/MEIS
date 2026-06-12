import bcrypt from 'bcrypt';
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
      `[edit-userdata] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { user_name, user_email, password } = await readBody<{
    user_name: string;
    user_email: string;
    password?: string;
  }>(event);
  if (!user_name || !user_email) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: 'user_name, user_emailは必須です' },
    });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
  const updateQuery = `
      UPDATE users 
      SET user_name = $1, user_email = $2, password = COALESCE($3, password)
      WHERE user_id = $4 AND facility_code = $5
      RETURNING *;
    `;
  const values = [
    user_name,
    user_email,
    hashedPassword,
    authenticatedUser.user_id,
    facilityCode,
  ];

  let result;

  try {
    result = await pool.query(updateQuery, values);
  } catch (error) {
    console.error('[edit-userdata]Error updating user:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'アカウント情報の更新に失敗しました' },
    });
  }

  // ユーザーが見つからない場合の処理
  if (result.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: 'ユーザーが見つかりません' },
    });
  }
  return result.rows[0];
});
