import { Readable } from 'node:stream';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const listEquipmentTypesMock = vi.fn();
const listEquipmentManufacturerMock = vi.fn();
const listEquipmentIdMock = vi.fn();
const listEquipmentModelsMock = vi.fn();
const getEquipmentDetailsMock = vi.fn();
const sampleLedgerFileExistsMock = vi.fn();
const createSampleLedgerReadStreamMock = vi.fn();

vi.mock('./types/service', () => ({
  listEquipmentTypes: (...args: unknown[]) => listEquipmentTypesMock(...args),
}));

vi.mock('./manufacturer/service', () => ({
  listEquipmentManufacturer: (...args: unknown[]) =>
    listEquipmentManufacturerMock(...args),
}));

vi.mock('./id/service', () => ({
  listEquipmentId: (...args: unknown[]) => listEquipmentIdMock(...args),
}));

vi.mock('./models/service', () => ({
  listEquipmentModels: (...args: unknown[]) => listEquipmentModelsMock(...args),
}));

vi.mock('./details/service', () => ({
  getEquipmentDetails: (...args: unknown[]) => getEquipmentDetailsMock(...args),
}));

vi.mock('./download-sample-xlsx-ledger/service', () => ({
  sampleLedgerFileExists: () => sampleLedgerFileExistsMock(),
  createSampleLedgerReadStream: () => createSampleLedgerReadStreamMock(),
}));

async function buildAppWithFacilityCode(facilityCode: string) {
  const { default: equipmentRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      await next();
    })
    .route('/equipment', equipmentRouter);

  return app;
}

describe('equipment router: GET /download-sample-xlsx-ledger', () => {
  beforeEach(() => {
    vi.resetModules();
    sampleLedgerFileExistsMock.mockReset();
    createSampleLedgerReadStreamMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・ファイルが存在する場合、200でxlsxファイルを返す', async () => {
    sampleLedgerFileExistsMock.mockReturnValue(true);
    createSampleLedgerReadStreamMock.mockReturnValue(
      Readable.from([Buffer.from('dummy xlsx content')]),
    );

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/download-sample-xlsx-ledger');

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
    sampleLedgerFileExistsMock.mockReturnValue(false);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/download-sample-xlsx-ledger');

    expect(res.status).toBe(404);
    expect(createSampleLedgerReadStreamMock).not.toHaveBeenCalled();
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: equipmentRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/equipment', equipmentRouter);

    const res = await app.request('/equipment/download-sample-xlsx-ledger');

    expect(res.status).toBe(401);
  });
});

describe('equipment router: POST /types', () => {
  beforeEach(() => {
    vi.resetModules();
    listEquipmentTypesMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・DB正常応答の場合、200でlistEquipmentTypesの結果を返す', async () => {
    listEquipmentTypesMock.mockResolvedValue([{ equipmentType: '人工呼吸器' }]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/types', { method: 'POST' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ equipmentType: '人工呼吸器' }]);
    expect(listEquipmentTypesMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
    });
  });

  it('認証済み・DBエラーの場合、500になる', async () => {
    listEquipmentTypesMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/types', { method: 'POST' });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: equipmentRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/equipment', equipmentRouter);

    const res = await app.request('/equipment/types', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(listEquipmentTypesMock).not.toHaveBeenCalled();
  });
});

describe('equipment router: POST /manufacturer', () => {
  beforeEach(() => {
    vi.resetModules();
    listEquipmentManufacturerMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・DB正常応答の場合、200でlistEquipmentManufacturerの結果を返す', async () => {
    listEquipmentManufacturerMock.mockResolvedValue([
      { equipmentManufacturer: 'メーカーA' },
    ]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/manufacturer', {
      method: 'POST',
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ equipmentManufacturer: 'メーカーA' }]);
    expect(listEquipmentManufacturerMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
    });
  });

  it('認証済み・DBエラーの場合、500になる', async () => {
    listEquipmentManufacturerMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/manufacturer', {
      method: 'POST',
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: equipmentRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/equipment', equipmentRouter);

    const res = await app.request('/equipment/manufacturer', {
      method: 'POST',
    });

    expect(res.status).toBe(401);
    expect(listEquipmentManufacturerMock).not.toHaveBeenCalled();
  });
});

describe('equipment router: POST /id', () => {
  beforeEach(() => {
    vi.resetModules();
    listEquipmentIdMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・DB正常応答の場合、200でequipmentIdを平坦化した配列を返す', async () => {
    listEquipmentIdMock.mockResolvedValue([
      { equipmentId: 'EQ001' },
      { equipmentId: 'EQ002' },
    ]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/id', { method: 'POST' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(['EQ001', 'EQ002']);
    expect(listEquipmentIdMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
    });
  });

  it('該当する機器が無い場合、404になる', async () => {
    listEquipmentIdMock.mockResolvedValue([]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/id', { method: 'POST' });

    expect(res.status).toBe(404);
  });

  it('認証済み・DBエラーの場合、500になる', async () => {
    listEquipmentIdMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/id', { method: 'POST' });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: equipmentRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/equipment', equipmentRouter);

    const res = await app.request('/equipment/id', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(listEquipmentIdMock).not.toHaveBeenCalled();
  });
});

describe('equipment router: POST /models', () => {
  const validBody = { equipmentType: '人工呼吸器' };

  beforeEach(() => {
    vi.resetModules();
    listEquipmentModelsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でlistEquipmentModelsの結果を返す', async () => {
    listEquipmentModelsMock.mockResolvedValue([{ equipmentModel: 'ModelA' }]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ equipmentModel: 'ModelA' }]);
    expect(listEquipmentModelsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      equipmentType: '人工呼吸器',
    });
  });

  it('該当する機器型番が無い場合、404になる', async () => {
    listEquipmentModelsMock.mockResolvedValue([]);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    listEquipmentModelsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('equipmentTypeが空文字の場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentType: '' }),
    });

    expect(res.status).toBe(400);
    expect(listEquipmentModelsMock).not.toHaveBeenCalled();
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: equipmentRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/equipment', equipmentRouter);

    const res = await app.request('/equipment/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listEquipmentModelsMock).not.toHaveBeenCalled();
  });
});

describe('equipment router: POST /details', () => {
  const validBody = { equipmentId: 'EQ001' };

  beforeEach(() => {
    vi.resetModules();
    getEquipmentDetailsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でgetEquipmentDetailsの結果を返す', async () => {
    getEquipmentDetailsMock.mockResolvedValue({
      equipmentName: '人工呼吸器A',
      equipmentModel: 'VT100',
      equipmentSerialNumber: 'SN-12345',
      equipmentType: 'Diagnostic',
    });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      equipmentName: '人工呼吸器A',
      equipmentModel: 'VT100',
      equipmentSerialNumber: 'SN-12345',
      equipmentType: 'Diagnostic',
    });
    expect(getEquipmentDetailsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      equipmentId: 'EQ001',
    });
  });

  it('該当する機器が無い場合、404になる', async () => {
    getEquipmentDetailsMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    getEquipmentDetailsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('equipmentIdが空文字の場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/equipment/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentId: '' }),
    });

    expect(res.status).toBe(400);
    expect(getEquipmentDetailsMock).not.toHaveBeenCalled();
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: equipmentRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/equipment', equipmentRouter);

    const res = await app.request('/equipment/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(getEquipmentDetailsMock).not.toHaveBeenCalled();
  });
});
