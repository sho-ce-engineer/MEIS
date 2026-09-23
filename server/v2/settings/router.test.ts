import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const updateUserRoleMock = vi.fn();

vi.mock('./admin/role-change/service', () => ({
  updateUserRole: (...args: unknown[]) => updateUserRoleMock(...args),
}));

async function buildAppWithFacilityCode(facilityCode: string) {
  const { default: settingsRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      await next();
    })
    .route('/settings', settingsRouter);

  return app;
}

describe('settings router: PUT /role-change', () => {
  const validBody = {
    targetUserId: 'user-1',
    newUserRole: 'admin',
  };

  beforeEach(() => {
    vi.resetModules();
    updateUserRoleMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('バリデーション成功・DB正常応答の場合、204を返す', async () => {
    updateUserRoleMock.mockResolvedValue({
      userId: 'user-1',
      userRole: 'admin',
    });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/role-change', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(updateUserRoleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: 'user-1',
        newUserRole: 'admin',
        facilityCode: 'FAC001',
      }),
    );
  });

  it('該当するレコードが無い場合、404になる', async () => {
    updateUserRoleMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/role-change', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('DBエラーの場合、500になる', async () => {
    updateUserRoleMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/role-change', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('targetUserIdが無い場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/role-change', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUserRole: 'admin' }),
    });

    expect(res.status).toBe(400);
    expect(updateUserRoleMock).not.toHaveBeenCalled();
  });

  it('newUserRoleが許可された値でない場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/role-change', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'user-1', newUserRole: 'owner' }),
    });

    expect(res.status).toBe(400);
    expect(updateUserRoleMock).not.toHaveBeenCalled();
  });
});
