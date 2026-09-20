import fs from 'node:fs';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

async function buildApp() {
  const { default: downloadSampleXlsxLedgerRouter } = await import(
    './router'
  );

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('jwtPayload', { user_id: 'user-1' });
      await next();
    })
    .route('/download-sample-xlsx-ledger', downloadSampleXlsxLedgerRouter);

  return app;
}

describe('equipment router: /download-sample-xlsx-ledger', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('認証済み・ファイルが存在する場合、200でxlsxファイルを返す', async () => {
    const app = await buildApp();
    const res = await app.request('/download-sample-xlsx-ledger');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="sample.xlsx"',
    );

    const body = new Uint8Array(await res.arrayBuffer());
    expect(body.length).toBeGreaterThan(0);
  });

  it('サンプルファイルが存在しない場合、404になる', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const app = await buildApp();
    const res = await app.request('/download-sample-xlsx-ledger');

    expect(res.status).toBe(404);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: downloadSampleXlsxLedgerRouter } = await import(
      './router'
    );

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/download-sample-xlsx-ledger', downloadSampleXlsxLedgerRouter);

    const res = await app.request('/download-sample-xlsx-ledger');

    expect(res.status).toBe(401);
  });
});
