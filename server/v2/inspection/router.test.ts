import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const listInspectionTypesMock = vi.fn();
const deleteInspectionResultsMock = vi.fn();
const countInspectionResultsMock = vi.fn();
const deleteInspectionItemMock = vi.fn();
const saveSortedInspectionItemsMock = vi.fn();

vi.mock('./types/service', () => ({
  listInspectionTypes: (...args: unknown[]) => listInspectionTypesMock(...args),
}));

vi.mock('./results-delete/service', () => ({
  deleteInspectionResults: (...args: unknown[]) =>
    deleteInspectionResultsMock(...args),
}));

vi.mock('./results-count/service', () => ({
  countInspectionResults: (...args: unknown[]) =>
    countInspectionResultsMock(...args),
}));

vi.mock('./item-delete/service', () => ({
  deleteInspectionItem: (...args: unknown[]) =>
    deleteInspectionItemMock(...args),
}));

vi.mock('./items-save-sorted/service', () => ({
  saveSortedInspectionItems: (...args: unknown[]) =>
    saveSortedInspectionItemsMock(...args),
}));

async function buildAppWithFacilityCode(facilityCode: string) {
  const { default: inspectionRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      await next();
    })
    .route('/inspection', inspectionRouter);

  return app;
}

describe('inspection router: POST /types', () => {
  const validBody = { equipmentModel: 'CT200' };

  beforeEach(() => {
    vi.resetModules();
    listInspectionTypesMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でlistInspectionTypesの結果を返す', async () => {
    listInspectionTypesMock.mockResolvedValue([{ inspectionType: '日常点検' }]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ inspectionType: '日常点検' }]);
    expect(listInspectionTypesMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      equipmentModel: 'CT200',
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    listInspectionTypesMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: inspectionRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/inspection', inspectionRouter);

    const res = await app.request('/inspection/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listInspectionTypesMock).not.toHaveBeenCalled();
  });

  it('equipmentModelが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentModel: '' }),
    });

    expect(res.status).toBe(400);
    expect(listInspectionTypesMock).not.toHaveBeenCalled();
  });
});

describe('inspection router: POST /results/count', () => {
  const validBody = { jpyDate: '2026-09-14' };

  beforeEach(() => {
    vi.resetModules();
    countInspectionResultsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でcountを返す', async () => {
    countInspectionResultsMock.mockResolvedValue(3);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 3 });
    expect(countInspectionResultsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      jpyDate: '2026-09-14',
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    countInspectionResultsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: inspectionRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/inspection', inspectionRouter);

    const res = await app.request('/inspection/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(countInspectionResultsMock).not.toHaveBeenCalled();
  });

  it('jpyDateが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jpyDate: '' }),
    });

    expect(res.status).toBe(400);
    expect(countInspectionResultsMock).not.toHaveBeenCalled();
  });
});

describe('inspection router: DELETE /results', () => {
  const validBody = { result_ids: ['RESULT-001', 'RESULT-002'] };

  beforeEach(() => {
    vi.resetModules();
    deleteInspectionResultsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    deleteInspectionResultsMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(deleteInspectionResultsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      resultIds: validBody.result_ids,
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    deleteInspectionResultsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: inspectionRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/inspection', inspectionRouter);

    const res = await app.request('/inspection/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(deleteInspectionResultsMock).not.toHaveBeenCalled();
  });

  it('result_idsが空配列の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_ids: [] }),
    });

    expect(res.status).toBe(400);
    expect(deleteInspectionResultsMock).not.toHaveBeenCalled();
  });
});

describe('inspection router: DELETE /items', () => {
  const validBody = {
    inspection_item_id: 'FAC001InspItemId20260914000000R123456',
  };

  beforeEach(() => {
    vi.resetModules();
    deleteInspectionItemMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    deleteInspectionItemMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(deleteInspectionItemMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      inspectionItemId: validBody.inspection_item_id,
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    deleteInspectionItemMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: inspectionRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/inspection', inspectionRouter);

    const res = await app.request('/inspection/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(deleteInspectionItemMock).not.toHaveBeenCalled();
  });

  it('inspection_item_idが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection_item_id: '' }),
    });

    expect(res.status).toBe(400);
    expect(deleteInspectionItemMock).not.toHaveBeenCalled();
  });
});

describe('inspection router: POST /items/sorted', () => {
  const validBody = {
    updatedItems: {
      外装点検: [{ inspection_item_id: 'ITEM-001' }],
    },
  };

  beforeEach(() => {
    vi.resetModules();
    saveSortedInspectionItemsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    saveSortedInspectionItemsMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/items/sorted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(saveSortedInspectionItemsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      updatedItems: validBody.updatedItems,
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    saveSortedInspectionItemsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/items/sorted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: inspectionRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/inspection', inspectionRouter);

    const res = await app.request('/inspection/items/sorted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(saveSortedInspectionItemsMock).not.toHaveBeenCalled();
  });

  it('inspection_item_idが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/inspection/items/sorted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updatedItems: { 外装点検: [{ inspection_item_id: '' }] },
      }),
    });

    expect(res.status).toBe(400);
    expect(saveSortedInspectionItemsMock).not.toHaveBeenCalled();
  });
});
