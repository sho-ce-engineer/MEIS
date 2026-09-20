import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const listEquipmentTypesMock = vi.fn();

vi.mock('./types/service', () => ({
  listEquipmentTypes: (...args: unknown[]) => listEquipmentTypesMock(...args),
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

describe('equipment router: POST /types', () => {
  beforeEach(() => {
    vi.resetModules();
    listEquipmentTypesMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・DB正常応答の場合、200でlistEquipmentTypesの結果を返す', async () => {
    listEquipmentTypesMock.mockResolvedValue([
      { equipmentType: '人工呼吸器' },
    ]);

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
