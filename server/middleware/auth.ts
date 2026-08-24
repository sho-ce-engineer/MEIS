import type { H3Event } from 'h3';
import jwt from 'jsonwebtoken';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/v2/',
];

export default defineEventHandler((event: H3Event) => {
  const path = getRequestURL(event).pathname;

  // APIパス以外はスキップ
  if (!path.startsWith('/api/')) {
    return;
  }

  // 認証不要パスはスキップ
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return;
  }

  const token = getCookie(event, 'auth.token');
  if (!token) {
    throw createError({
      statusCode: 401,
      statusText: 'Unauthorized',
      data: { message: 'ログインが必要です。' },
    });
  }

  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.error('[auth middleware] SECRET_KEY is not configured');
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバー設定エラー' },
    });
  }

  try {
    const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;
    event.context.user = {
      user_id: decoded.user_id,
    };
  } catch (error) {
    console.error('[auth middleware] JWT verification failed:', error);
    throw createError({
      statusCode: 401,
      statusText: 'Unauthorized',
      data: { message: 'ログインが必要です。' },
    });
  }
});
