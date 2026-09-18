import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const listInspectionTypesMock = vi.fn();
const deleteInspectionItemMock = vi.fn();
const saveSortedInspectionItemsMock = vi.fn();
const listInspectionItemDetailsMock = vi.fn();

vi.mock('./types/service', () => ({
  listInspectionTypes: (...args: unknown[]) => listInspectionTypesMock(...args),
}));

vi.mock('./item-delete/service', () => ({
  deleteInspectionItem: (...args: unknown[]) =>
    deleteInspectionItemMock(...args),
}));

vi.mock('./items-save-sorted/service', () => ({
  saveSortedInspectionItems: (...args: unknown[]) =>
    saveSortedInspectionItemsMock(...args),
}));

vi.mock('./item-details/service', () => ({
  listInspectionItemDetails: (...args: unknown[]) =>
    listInspectionItemDetailsMock(...args),
}));

async function buildAppWithFacilityCode(facilityCode: string) {
  const { default: itemsRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      await next();
    })
    .route('/items', itemsRouter);

  return app;
}

describe('inspection/items router: POST /types', () => {
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
    const res = await app.request('/items/types', {
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
    const res = await app.request('/items/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: itemsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/items', itemsRouter);

    const res = await app.request('/items/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listInspectionTypesMock).not.toHaveBeenCalled();
  });

  it('equipmentModelが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentModel: '' }),
    });

    expect(res.status).toBe(400);
    expect(listInspectionTypesMock).not.toHaveBeenCalled();
  });
});

describe('inspection/items router: DELETE /', () => {
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
    const res = await app.request('/items', {
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
    const res = await app.request('/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: itemsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/items', itemsRouter);

    const res = await app.request('/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(deleteInspectionItemMock).not.toHaveBeenCalled();
  });

  it('inspection_item_idが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection_item_id: '' }),
    });

    expect(res.status).toBe(400);
    expect(deleteInspectionItemMock).not.toHaveBeenCalled();
  });
});

describe('inspection/items router: POST /sorted', () => {
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
    const res = await app.request('/items/sorted', {
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
    const res = await app.request('/items/sorted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: itemsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/items', itemsRouter);

    const res = await app.request('/items/sorted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(saveSortedInspectionItemsMock).not.toHaveBeenCalled();
  });

  it('inspection_item_idが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/sorted', {
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

describe('inspection/items router: POST /details', () => {
  const validBody = { inspectionItemIds: ['ITEM-001', 'ITEM-002'] };

  beforeEach(() => {
    vi.resetModules();
    listInspectionItemDetailsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でlistInspectionItemDetailsの結果を返す', async () => {
    listInspectionItemDetailsMock.mockResolvedValue([
      { inspectionItemId: 'ITEM-001' },
    ]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ inspectionItemId: 'ITEM-001' }]);
    expect(listInspectionItemDetailsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      inspectionItemIds: validBody.inspectionItemIds,
    });
  });

  it('該当データが0件の場合、404になる', async () => {
    listInspectionItemDetailsMock.mockResolvedValue([]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    listInspectionItemDetailsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: itemsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/items', itemsRouter);

    const res = await app.request('/items/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listInspectionItemDetailsMock).not.toHaveBeenCalled();
  });

  it('inspectionItemIdsが空配列の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionItemIds: [] }),
    });

    expect(res.status).toBe(400);
    expect(listInspectionItemDetailsMock).not.toHaveBeenCalled();
  });
});
