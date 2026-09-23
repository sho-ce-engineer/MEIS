import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';
import { DatabaseError, DrizzleQueryError } from '~/server/db';

const updateUserRoleMock = vi.fn();
const deleteUserMock = vi.fn();
const updateUserDataMock = vi.fn();
const listUsersMock = vi.fn();

vi.mock('./admin/role-change/service', () => ({
  updateUserRole: (...args: unknown[]) => updateUserRoleMock(...args),
}));

vi.mock('./admin/user-delete/service', () => ({
  deleteUser: (...args: unknown[]) => deleteUserMock(...args),
}));

vi.mock('./users/edit-userdata/service', () => ({
  updateUserData: (...args: unknown[]) => updateUserDataMock(...args),
}));

vi.mock('./admin/list-users/service', () => ({
  listUsers: (...args: unknown[]) => listUsersMock(...args),
}));

async function buildAppWithFacilityCode(
  facilityCode: string,
  userId = 'user-1',
) {
  const { default: settingsRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('facilityCode', facilityCode);
      c.set('jwtPayload', { user_id: userId });
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

describe('settings router: DELETE /', () => {
  const validBody = {
    targetUserId: 'user-1',
  };

  beforeEach(() => {
    vi.resetModules();
    deleteUserMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('バリデーション成功・DB正常応答の場合、204を返す', async () => {
    deleteUserMock.mockResolvedValue({
      userId: 'user-1',
      facilityCode: 'FAC001',
    });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(deleteUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: 'user-1',
        facilityCode: 'FAC001',
      }),
    );
  });

  it('該当するレコードが無い場合、404になる', async () => {
    deleteUserMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('DBエラーの場合、500になる', async () => {
    deleteUserMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('targetUserIdが無い場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });
});

describe('settings router: PATCH /edit-userdata', () => {
  const validBody = {
    userName: '山田太郎',
    userEmail: 'yamada@example.com',
  };

  beforeEach(() => {
    vi.resetModules();
    updateUserDataMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('バリデーション成功・DB正常応答の場合、204を返す', async () => {
    updateUserDataMock.mockResolvedValue({
      userName: '山田太郎',
      userEmail: 'yamada@example.com',
    });

    const app = await buildAppWithFacilityCode('FAC001', 'user-1');
    const res = await app.request('/settings/edit-userdata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(204);
    expect(updateUserDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        facilityCode: 'FAC001',
        userName: '山田太郎',
        userEmail: 'yamada@example.com',
      }),
    );
  });

  it('該当するレコードが無い場合、404になる', async () => {
    updateUserDataMock.mockResolvedValue(undefined);

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/edit-userdata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(404);
  });

  it('メールアドレスの一意制約違反（23505）の場合、409になる', async () => {
    const pgError = new DatabaseError(
      'duplicate key value violates unique constraint',
      0,
      'error',
    );
    pgError.code = '23505';
    updateUserDataMock.mockRejectedValue(
      new DrizzleQueryError('update users...', [], pgError),
    );

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/edit-userdata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(409);
  });

  it('その他のDBエラーの場合、500になる', async () => {
    updateUserDataMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/edit-userdata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('userNameが無い場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/edit-userdata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: 'yamada@example.com' }),
    });

    expect(res.status).toBe(400);
    expect(updateUserDataMock).not.toHaveBeenCalled();
  });

  it('userEmailが無い場合、400になる', async () => {
    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/edit-userdata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: '山田太郎' }),
    });

    expect(res.status).toBe(400);
    expect(updateUserDataMock).not.toHaveBeenCalled();
  });
});

describe('settings router: POST /users', () => {
  beforeEach(() => {
    vi.resetModules();
    listUsersMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('バリデーション成功・DB正常応答の場合、200でitems・totalを返す', async () => {
    listUsersMock.mockResolvedValue({
      items: [{ userId: 'user-1', userName: '山田太郎', userRole: 'admin' }],
      total: 1,
    });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, itemsPerPage: 10 }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: [{ userId: 'user-1', userName: '山田太郎', userRole: 'admin' }],
      total: 1,
    });
    expect(listUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityCode: 'FAC001',
        page: 1,
        itemsPerPage: 10,
        sortRow: 'userName',
        sortByOrder: 'asc',
      }),
    );
  });

  it('不正なsortRow・sortByOrderの場合、デフォルト値にフォールバックする', async () => {
    listUsersMock.mockResolvedValue({ items: [], total: 0 });

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortRow: 'invalidKey', sortByOrder: 'invalid' }),
    });

    expect(res.status).toBe(200);
    expect(listUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sortRow: 'userName',
        sortByOrder: 'asc',
      }),
    );
  });

  it('DBエラーの場合、500になる', async () => {
    listUsersMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithFacilityCode('FAC001');
    const res = await app.request('/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(500);
  });
});
