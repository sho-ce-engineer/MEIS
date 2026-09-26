import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from './errorHandler';

const buildApp = (error: Error) =>
  new Hono()
    .get('/', () => {
      throw error;
    })
    .onError(errorHandler);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  it('HTTPExceptionの場合、そのステータスコードと{ message }のJSONを返す', async () => {
    const res = await buildApp(
      new HTTPException(404, { message: 'ユーザーが見つかりません。' }),
    ).request('/');

    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(await res.json()).toEqual({ message: 'ユーザーが見つかりません。' });
  });

  it('HTTPException以外のエラーの場合、500と共通のメッセージを返し、エラー内容はレスポンスに含めない', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await buildApp(new Error('connection refused')).request('/');

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      message: 'サーバーエラーが発生しました。',
    });
    expect(console.error).toHaveBeenCalled();
  });
});
