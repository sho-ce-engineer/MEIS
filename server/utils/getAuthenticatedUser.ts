import type { H3Event } from 'h3';

export const getAuthenticatedUser = (event: H3Event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusText: 'Unauthorized',
      data: { message: 'ログインが必要です。' },
    });
  }
  return user;
};
