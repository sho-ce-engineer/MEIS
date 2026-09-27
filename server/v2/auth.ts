import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { decode } from 'next-auth/jwt';
import type { QueryResult } from 'pg';
import pool from '~/server/config/db';
import { AUTH_COOKIE_NAME, authSecret } from '~/server/v2/auth/authOptions';

export type Variables = {
  userId: string;
  facilityCode: string;
  facilityName: string;
  userRole: string;
};

export const authMiddleware: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  const sessionToken = getCookie(c, AUTH_COOKIE_NAME);
  const payload = sessionToken
    ? await decode({ token: sessionToken, secret: authSecret }).catch(
        () => null,
      )
    : null;

  if (typeof payload?.userId !== 'string') {
    throw new HTTPException(401, { message: 'ログインが必要です。' });
  }

  c.set('userId', payload.userId);
  await next();
};

export const facilityMiddleware: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  const userId = c.get('userId');

  const authenticatedUserQuery = `
    SELECT
      u.facility_code,
      f.facility_name
    FROM users u
    LEFT JOIN facilities f ON u.facility_code = f.facility_code
    WHERE u.user_id = $1
  `;

  let AuthenticatedUserFacilityResult: QueryResult;

  try {
    AuthenticatedUserFacilityResult = await pool.query(authenticatedUserQuery, [
      userId,
    ]);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('[auth] Failed to query facility code:', error);
    throw new HTTPException(500, {
      message: '施設コードの取得に失敗しました。',
    });
  }

  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(`[auth] Facility code not found for user_id: ${userId}`);
    throw new HTTPException(404, { message: '施設コードが見つかりません。' });
  }

  const facilityCode = AuthenticatedUserFacilityResult.rows[0].facility_code;
  const facilityName = AuthenticatedUserFacilityResult.rows[0].facility_name;

  c.set('facilityCode', facilityCode);
  c.set('facilityName', facilityName);

  await next();
};

export const adminUserOnlyMiddleware: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  const userId = c.get('userId');

  const authenticatedUserRoleQuery = `
    SELECT user_role FROM users
    WHERE user_id = $1
  `;
  let authenticatedUserRoleResult: QueryResult;

  try {
    authenticatedUserRoleResult = await pool.query(authenticatedUserRoleQuery, [
      userId,
    ]);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('[auth] Failed to query user_role', error);
    throw new HTTPException(500, {
      message: 'ユーザーの権限取得に失敗しました。',
    });
  }

  if (authenticatedUserRoleResult.rowCount === 0) {
    throw new HTTPException(404, {
      message: 'ユーザー権限情報が見つかりません。',
    });
  }

  if (authenticatedUserRoleResult.rows[0].user_role !== 'admin') {
    throw new HTTPException(403, { message: '管理者権限がありません。' });
  }

  const userRole = authenticatedUserRoleResult.rows[0].user_role;

  c.set('userRole', userRole);

  await next();
};
