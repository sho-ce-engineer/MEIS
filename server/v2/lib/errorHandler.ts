import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ApiError } from '~/types/api-error';

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof HTTPException) {
    return c.json<ApiError>({ message: error.message }, error.status);
  }

  console.error('[v2]Unhandled error:', error);
  return c.json<ApiError>({ message: 'サーバーエラーが発生しました。' }, 500);
};
