import type { H3Event } from 'h3';
import jwt from 'jsonwebtoken';
import pool from '~/server/config/db';

export default defineEventHandler(async (event) => {
  //認証状態の確認
  const ensureAuth = (event: H3Event) => {
    const authHeaderValue = getRequestHeader(event, 'authorization');
    if (!authHeaderValue) {
      console.error('[session] Authorization header is missing');
      throw createError({
        statusCode: 401,
        statusText: 'Unauthorized',
        data: { message: 'Authorizationヘッダーが見つかりません。' },
      });
    }

    // Authorizationヘッダーからトークンを抽出
    const extractToken = (authHeaderValue: string) => {
      const [, token] = authHeaderValue.split(`Bearer `);
      return token;
    };

    const extractedToken = extractToken(authHeaderValue);

    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      console.error('[session]SECRET_KEY is not configured');
      throw createError({
        statusCode: 500,
        statusText: 'Internal Server Error',
        data: { message: '秘密鍵が設定されていません。' },
      });
    }

    try {
      const decodedToken = jwt.verify(
        extractedToken,
        SECRET_KEY,
      ) as jwt.JwtPayload;
      return decodedToken;
    } catch (error) {
      console.error('[session]JWT verification failed:', error);
      throw createError({
        statusCode: 401,
        statusText: 'Unauthorized',
        data: { message: 'ログインが必要です。' },
      });
    }
  };

  const decodedData = ensureAuth(event);
  const userId = decodedData.user_id;

  const query = `
  SELECT 
    u.user_id, 
    u.user_email, 
    u.user_name, 
    u.user_role, 
    u.facility_code, 
    f.facility_name
  FROM 
    users u
  LEFT JOIN 
    facilities f 
  ON 
    u.facility_code = f.facility_code
  WHERE 
    u.user_id = $1
`;

  const result = await pool.query(query, [userId]);

  if (result.rowCount === 0) {
    console.error(`[session] User not found for user_id: ${userId}`);
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: 'ユーザーが見つかりません。' },
    });
  }

  const user = result.rows[0];
  return {
    user_id: user.user_id,
    email: user.user_email,
    name: user.user_name,
    role: user.user_role,
    facility_code: user.facility_code,
    facility_name: user.facility_name,
  };
});
