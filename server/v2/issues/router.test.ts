import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const deleteIssueMock = vi.fn();

vi.mock('./delete/service', () => ({
  deleteIssue: (...args: unknown[]) => deleteIssueMock(...args),
}));

async function buildAppWithFacilityCode(facilityCode: string) {
  const { default: issuesRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      await next();
    })
    .route('/issues', issuesRouter);

  return app;
}

describe('issues router: DELETE /', () => {
  const validBody = { issue_id: 'FAC001IssueId20260914000000R123456' };

  beforeEach(() => {
    vi.resetModules();
    deleteIssueMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    deleteIssueMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(deleteIssueMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      issueId: validBody.issue_id,
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    deleteIssueMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: issuesRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/issues', issuesRouter);

    const res = await app.request('/issues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(deleteIssueMock).not.toHaveBeenCalled();
  });

  it('issue_idが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_id: '' }),
    });

    expect(res.status).toBe(400);
    expect(deleteIssueMock).not.toHaveBeenCalled();
  });
});
