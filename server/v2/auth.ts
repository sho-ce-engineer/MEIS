import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { JwtVariables } from 'hono/jwt';
import { jwt } from 'hono/jwt';
import pool from '~/server/config/db';

type Variables = JwtVariables<{ user_id: string }> & {
  facilityCode: string;
};

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  console.error('[auth middleware] SECRET_KEY is not configured');
  throw new Error('SECRET_KEY is not configured');
}

export const authMiddleware = jwt({
  secret: secretKey,
  alg: 'HS256',
  cookie: 'auth.token',
});

export const facilityMiddleware: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  // 認証ユーザーの取得
  const authenticatedUser = c.get('jwtPayload');

  // 認証ユーザーの施設コードを取得
  const authenticatedUserQuery = `
    SELECT facility_code FROM users
    WHERE user_id = $1
  `;

  try {
    const AuthenticatedUserFacilityResult = await pool.query(
      authenticatedUserQuery,
      [authenticatedUser.user_id],
    );

    if (AuthenticatedUserFacilityResult.rowCount === 0) {
      console.error(
        `[auth] Facility code not found for user_id: ${authenticatedUser.user_id}`,
      );
      throw new HTTPException(404, { message: '施設コードが見つかりません。' });
    }

    const facilityCode = AuthenticatedUserFacilityResult.rows[0].facility_code;

    c.set('facilityCode', facilityCode);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('[auth] Failed to query facility code:', error);
    throw new HTTPException(500, { message: '施設コードの取得に失敗しました。' });
  }

  await next();
};
