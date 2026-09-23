import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const deleteInspectionResultsMock = vi.fn();
const countInspectionResultsMock = vi.fn();
const saveInspectionResultsMock = vi.fn();

vi.mock(
  '~/server/v2/inspection/results/delete-inspection-results/service',
  () => ({
    deleteInspectionResults: (...args: unknown[]) =>
      deleteInspectionResultsMock(...args),
  }),
);

vi.mock(
  '~/server/v2/inspection/results/count-inspection-results/service',
  () => ({
    countInspectionResults: (...args: unknown[]) =>
      countInspectionResultsMock(...args),
  }),
);

vi.mock(
  '~/server/v2/inspection/results/save-inspection-results/service',
  () => ({
    saveInspectionResults: (...args: unknown[]) =>
      saveInspectionResultsMock(...args),
  }),
);

async function buildAppWithFacilityCode(facilityCode: string) {
  const { default: resultsRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      await next();
    })
    .route('/results', resultsRouter);

  return app;
}

describe('inspection/results router: POST /count', () => {
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
    const res = await app.request('/results/count', {
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
    const res = await app.request('/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: resultsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/results', resultsRouter);

    const res = await app.request('/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(countInspectionResultsMock).not.toHaveBeenCalled();
  });

  it('jpyDateが空文字の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/results/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jpyDate: '' }),
    });

    expect(res.status).toBe(400);
    expect(countInspectionResultsMock).not.toHaveBeenCalled();
  });
});

describe('inspection/results router: DELETE /', () => {
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
    const res = await app.request('/results', {
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
    const res = await app.request('/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: resultsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/results', resultsRouter);

    const res = await app.request('/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(deleteInspectionResultsMock).not.toHaveBeenCalled();
  });

  it('result_idsが空配列の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_ids: [] }),
    });

    expect(res.status).toBe(400);
    expect(deleteInspectionResultsMock).not.toHaveBeenCalled();
  });
});

describe('inspection/results router: POST /', () => {
  const validBody = {
    results: [
      {
        result_id: 'RESULT-001',
        user_id: 'USER-001',
        inspection_item_id: 'ITEM-001',
        equipment_id: 'EQ-001',
        equipment_serial_number: 'SN-001',
        result: '55',
        notes: 'note-1',
        inspection_date: '2026-09-18T12:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    vi.resetModules();
    saveInspectionResultsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、204を返す', async () => {
    saveInspectionResultsMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(saveInspectionResultsMock).toHaveBeenCalledWith({
      facilityCode: 'FAC001',
      results: [
        {
          resultId: 'RESULT-001',
          userId: 'USER-001',
          inspectionItemId: 'ITEM-001',
          equipmentId: 'EQ-001',
          equipmentSerialNumber: 'SN-001',
          result: '55',
          notes: 'note-1',
          inspectionDate: '2026-09-18T12:00:00.000Z',
        },
      ],
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    saveInspectionResultsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: resultsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/results', resultsRouter);

    const res = await app.request('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(saveInspectionResultsMock).not.toHaveBeenCalled();
  });

  it('resultsが空配列の場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: [] }),
    });

    expect(res.status).toBe(400);
    expect(saveInspectionResultsMock).not.toHaveBeenCalled();
  });
});
