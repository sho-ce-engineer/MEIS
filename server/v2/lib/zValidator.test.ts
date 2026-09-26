import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler } from './errorHandler';
import { zValidator } from './zValidator';

const schema = z.object({ name: z.string().min(1) });

const app = new Hono()
  .post('/', zValidator('json', schema), (c) => c.json(c.req.valid('json')))
  .onError(errorHandler);

const postJson = (body: unknown) =>
  app.request('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('zValidator', () => {
  it('検証に成功した場合、検証済みの値をハンドラーへ渡す', async () => {
    const res = await postJson({ name: '山田' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: '山田' });
  });

  it('検証に失敗した場合、400と{ message }のJSONを返す', async () => {
    const res = await postJson({ name: '' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: '入力内容に誤りがあります。',
    });
  });
});
