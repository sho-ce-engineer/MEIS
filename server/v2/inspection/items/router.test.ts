import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const listInspectionTypesMock = vi.fn();
const deleteInspectionItemMock = vi.fn();
const saveSortedInspectionItemsMock = vi.fn();
const listInspectionItemDetailsMock = vi.fn();
const listInspectionItemsMock = vi.fn();
const addInspectionItemMock = vi.fn();
const copyInspectionItemsMock = vi.fn();
const updateInspectionItemMock = vi.fn();

vi.mock('~/server/v2/inspection/items/list-inspection-types/service', () => ({
  listInspectionTypes: (...args: unknown[]) => listInspectionTypesMock(...args),
}));

vi.mock('~/server/v2/inspection/items/add-inspection-item/service', () => ({
  addInspectionItem: (...args: unknown[]) => addInspectionItemMock(...args),
}));

vi.mock('~/server/v2/inspection/items/delete-inspection-item/service', () => ({
  deleteInspectionItem: (...args: unknown[]) =>
    deleteInspectionItemMock(...args),
}));

vi.mock(
  '~/server/v2/inspection/items/save-sorted-inspection-items/service',
  () => ({
    saveSortedInspectionItems: (...args: unknown[]) =>
      saveSortedInspectionItemsMock(...args),
  }),
);

vi.mock(
  '~/server/v2/inspection/items/list-inspection-item-details/service',
  () => ({
    listInspectionItemDetails: (...args: unknown[]) =>
      listInspectionItemDetailsMock(...args),
  }),
);

vi.mock('~/server/v2/inspection/items/list-inspection-items/service', () => ({
  listInspectionItems: (...args: unknown[]) => listInspectionItemsMock(...args),
}));

vi.mock('~/server/v2/inspection/items/copy-inspection-items/service', () => ({
  copyInspectionItems: (...args: unknown[]) => copyInspectionItemsMock(...args),
}));

vi.mock('~/server/v2/inspection/items/update-inspection-item/service', () => ({
  updateInspectionItem: (...args: unknown[]) =>
    updateInspectionItemMock(...args),
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
    inspectionItemId: 'FAC001InspItemId20260914000000R123456',
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
      inspectionItemId: validBody.inspectionItemId,
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
      body: JSON.stringify({ inspectionItemId: '' }),
    });

    expect(res.status).toBe(400);
    expect(deleteInspectionItemMock).not.toHaveBeenCalled();
  });
});

describe('inspection/items router: PUT /sorted', () => {
  const validBody = {
    updatedItems: {
      外装点検: [{ inspectionItemId: 'ITEM-001' }],
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
      method: 'PUT',
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
      method: 'PUT',
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(saveSortedInspectionItemsMock).not.toHaveBeenCalled();
  });

  it('inspection_item_idが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/sorted', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updatedItems: { 外装点検: [{ inspectionItemId: '' }] },
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

describe('inspection/items router: POST /list', () => {
  const validBody = { equipmentModel: 'CT200', inspectionType: '日常点検' };

  beforeEach(() => {
    vi.resetModules();
    listInspectionItemsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でlistInspectionItemsの結果を返す', async () => {
    listInspectionItemsMock.mockResolvedValue([
      { inspectionItemId: 'ITEM-001' },
    ]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ inspectionItemId: 'ITEM-001' }]);
    expect(listInspectionItemsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      equipmentModel: 'CT200',
      inspectionType: '日常点検',
    });
  });

  it('該当データが0件の場合、404になる', async () => {
    listInspectionItemsMock.mockResolvedValue([]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    listInspectionItemsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/list', {
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

    const res = await app.request('/items/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listInspectionItemsMock).not.toHaveBeenCalled();
  });

  it('必須項目が欠落している場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentModel: 'CT200' }),
    });

    expect(res.status).toBe(400);
    expect(listInspectionItemsMock).not.toHaveBeenCalled();
  });
});

describe('inspection/items router: POST /', () => {
  const validBody = {
    inspectionType: '日常点検',
    inspectionItemCategory: '外装点検',
    inspectionItem: 'item-1',
    inspectionComponentType: 'InspectionCustomCheck',
    equipmentType: 'Diagnostic',
    equipmentModel: 'CT200',
  };

  beforeEach(() => {
    vi.resetModules();
    addInspectionItemMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でaddInspectionItemの結果を返す', async () => {
    addInspectionItemMock.mockResolvedValue({ inspectionItemId: 'ITEM-NEW' });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ inspectionItemId: 'ITEM-NEW' });
    expect(addInspectionItemMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      inspectionType: validBody.inspectionType,
      inspectionItemCategory: validBody.inspectionItemCategory,
      inspectionItem: validBody.inspectionItem,
      inspectionItemDescription: undefined,
      inspectionComponentType: validBody.inspectionComponentType,
      equipmentType: validBody.equipmentType,
      equipmentModel: validBody.equipmentModel,
      min: undefined,
      max: undefined,
      suffix: undefined,
      lowerLimit: undefined,
      upperLimit: undefined,
    });
  });

  it('数値項目が未入力（null）の場合も、200でnullのままaddInspectionItemへ渡す', async () => {
    addInspectionItemMock.mockResolvedValue({ inspectionItemId: 'ITEM-NEW' });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        min: null,
        max: null,
        lowerLimit: null,
        upperLimit: null,
      }),
    });

    expect(res.status).toBe(200);
    expect(addInspectionItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        min: null,
        max: null,
        lowerLimit: null,
        upperLimit: null,
      }),
    );
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    addInspectionItemMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
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

    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(addInspectionItemMock).not.toHaveBeenCalled();
  });

  it('必須項目が欠落している場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, inspectionItem: '' }),
    });

    expect(res.status).toBe(400);
    expect(addInspectionItemMock).not.toHaveBeenCalled();
  });
});

describe('inspection/items router: POST /copy', () => {
  const validBody = {
    baseInspectionData: {
      baseEquipmentType: 'Diagnostic',
      baseEquipmentModel: 'CT200',
      baseInspectionType: '日常点検',
    },
    targetInspectionData: {
      targetEquipmentType: 'Diagnostic',
      targetEquipmentModel: 'CT300',
      targetInspectionType: '日常点検',
    },
  };

  beforeEach(() => {
    vi.resetModules();
    copyInspectionItemsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    copyInspectionItemsMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(copyInspectionItemsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      baseEquipmentType: 'Diagnostic',
      baseEquipmentModel: 'CT200',
      baseInspectionType: '日常点検',
      targetEquipmentType: 'Diagnostic',
      targetEquipmentModel: 'CT300',
      targetInspectionType: '日常点検',
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    copyInspectionItemsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/copy', {
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

    const res = await app.request('/items/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(copyInspectionItemsMock).not.toHaveBeenCalled();
  });

  it('必須項目が欠落している場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    expect(copyInspectionItemsMock).not.toHaveBeenCalled();
  });
});

describe('inspection/items router: PUT /', () => {
  const validBody = {
    inspectionItemId: 'ITEM-001',
    inspectionType: '日常点検',
    inspectionItemCategory: '外装点検',
    inspectionItem: 'item-1',
    inspectionComponentType: 'InspectionCustomCheck',
    equipmentType: 'Diagnostic',
    equipmentModel: 'CT200',
    inspectionSortNumber: 1,
  };

  beforeEach(() => {
    vi.resetModules();
    updateInspectionItemMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でupdateInspectionItemの結果を返す', async () => {
    updateInspectionItemMock.mockResolvedValue({
      inspectionItemId: 'ITEM-001',
    });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ inspectionItemId: 'ITEM-001' });
    expect(updateInspectionItemMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      inspectionItemId: 'ITEM-001',
      inspectionType: '日常点検',
      inspectionItemCategory: '外装点検',
      inspectionItem: 'item-1',
      inspectionItemDescription: undefined,
      inspectionComponentType: 'InspectionCustomCheck',
      inspectionSortNumber: 1,
      min: undefined,
      max: undefined,
      suffix: undefined,
      lowerLimit: undefined,
      upperLimit: undefined,
    });
  });

  it('数値項目がDBから取得した文字列のまま送られた場合も、200でそのままupdateInspectionItemへ渡す', async () => {
    updateInspectionItemMock.mockResolvedValue({
      inspectionItemId: 'ITEM-001',
    });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        min: '0',
        max: '100',
        lowerLimit: '10',
        upperLimit: null,
      }),
    });

    expect(res.status).toBe(200);
    expect(updateInspectionItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        min: '0',
        max: '100',
        lowerLimit: '10',
        upperLimit: null,
      }),
    );
  });

  it('該当する点検項目が無い場合、404になる', async () => {
    updateInspectionItemMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    updateInspectionItemMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'PUT',
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(updateInspectionItemMock).not.toHaveBeenCalled();
  });

  it('必須項目が欠落している場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, inspectionItem: '' }),
    });

    expect(res.status).toBe(400);
    expect(updateInspectionItemMock).not.toHaveBeenCalled();
  });
});
