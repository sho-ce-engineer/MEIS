import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const addIssueMock = vi.fn();
const deleteIssueMock = vi.fn();
const getTodayIssuesCountMock = vi.fn();
const listIssuesMock = vi.fn();

vi.mock('./add/service', () => ({
  addIssue: (...args: unknown[]) => addIssueMock(...args),
}));

vi.mock('./delete/service', () => ({
  deleteIssue: (...args: unknown[]) => deleteIssueMock(...args),
}));

vi.mock('./count/service', () => ({
  getTodayIssuesCount: (...args: unknown[]) => getTodayIssuesCountMock(...args),
}));

vi.mock('./list/service', () => ({
  listIssues: (...args: unknown[]) => listIssuesMock(...args),
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

describe('issues router: POST /list', () => {
  const validBody = {
    page: 1,
    itemsPerPage: 10,
    sortRow: 'reported_date',
    sortByOrder: 'desc',
    filterCriteria: {},
  };

  beforeEach(() => {
    vi.resetModules();
    listIssuesMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でlistIssuesの結果を返す', async () => {
    listIssuesMock.mockResolvedValue({ items: [], total: 0 });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], total: 0 });
    expect(listIssuesMock).toHaveBeenCalledWith({
      page: 1,
      itemsPerPage: 10,
      sortRow: 'reported_date',
      sortByOrder: 'desc',
      filterCriteria: {},
      facilityCode: 'FAC001',
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    listIssuesMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues/list', {
      method: 'POST',
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

    const res = await app.request('/issues/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listIssuesMock).not.toHaveBeenCalled();
  });

  it('不正なsortRowを送ると400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, sortRow: 'not-a-valid-column' }),
    });

    expect(res.status).toBe(400);
    expect(listIssuesMock).not.toHaveBeenCalled();
  });
});

describe('issues router: POST /', () => {
  const validBody = {
    reported_date: '2026-09-14T11:55:51.756Z',
    reporter: 'reporter-1',
    location: 'location-1',
    description: 'description-1',
    equipment_id: 'EQ001',
  };

  beforeEach(() => {
    vi.resetModules();
    addIssueMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    addIssueMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(addIssueMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      reportedDate: validBody.reported_date,
      reporter: validBody.reporter,
      location: validBody.location,
      description: validBody.description,
      equipmentId: validBody.equipment_id,
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    addIssueMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues', {
      method: 'POST',
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(addIssueMock).not.toHaveBeenCalled();
  });

  it('必須項目が欠落している場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, reporter: '' }),
    });

    expect(res.status).toBe(400);
    expect(addIssueMock).not.toHaveBeenCalled();
  });
});

describe('issues router: GET /count', () => {
  beforeEach(() => {
    vi.resetModules();
    getTodayIssuesCountMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・DB正常応答の場合、200でcountを返す', async () => {
    getTodayIssuesCountMock.mockResolvedValue(3);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues/count');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 3 });
    expect(getTodayIssuesCountMock).toHaveBeenCalledWith('FAC001');
  });

  it('認証済み・DBエラーの場合、500になる', async () => {
    getTodayIssuesCountMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/issues/count');

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: issuesRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/issues', issuesRouter);

    const res = await app.request('/issues/count');

    expect(res.status).toBe(401);
    expect(getTodayIssuesCountMock).not.toHaveBeenCalled();
  });
});

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
