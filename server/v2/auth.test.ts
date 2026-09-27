import { Hono } from 'hono';
import { encode } from 'next-auth/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const TEST_SECRET = 'test-secret-key';

vi.mock('~/server/config/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock('~/server/db', () => ({ db: {} }));

describe('SECRET_KEY未設定時', () => {
  const originalSecretKey = process.env.SECRET_KEY;

  afterEach(() => {
    process.env.SECRET_KEY = originalSecretKey;
    vi.resetModules();
  });

  it('SECRET_KEYが設定されていないとモジュール読み込み時にエラーになる', async () => {
    delete process.env.SECRET_KEY;
    await expect(import('~/server/v2/auth')).rejects.toThrow(
      'SECRET_KEY is not configured',
    );
  });
});

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.SECRET_KEY = TEST_SECRET;
    vi.resetModules();
  });

  async function buildApp() {
    const { authMiddleware } = await import('~/server/v2/auth');
    const { errorHandler } = await import('~/server/v2/lib/errorHandler');
    return new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .get('/', (c) => c.json({ userId: c.get('userId') }))
      .onError(errorHandler);
  }

  const createToken = (
    token: Record<string, unknown>,
    { secret = TEST_SECRET, maxAge = 60 * 60 } = {},
  ) => encode({ token, secret, maxAge });

  it('Cookieが無い場合、401で「ログインが必要です。」になる', async () => {
    const app = await buildApp();

    const res = await app.request('/');

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: 'ログインが必要です。' });
  });

  it('不正なトークンの場合、401になる', async () => {
    const app = await buildApp();

    const res = await app.request('/', {
      headers: { Cookie: 'auth.token=invalid-token' },
    });

    expect(res.status).toBe(401);
  });

  it('期限切れのトークンの場合、401になる', async () => {
    const app = await buildApp();
    const expiredToken = await createToken(
      { sub: 'user-1', userId: 'user-1' },
      { maxAge: -60 },
    );

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${expiredToken}` },
    });

    expect(res.status).toBe(401);
  });

  it('別の秘密鍵で暗号化されたトークンの場合、401になる', async () => {
    const app = await buildApp();
    const otherSecretToken = await createToken(
      { sub: 'user-1', userId: 'user-1' },
      { secret: 'another-secret-key' },
    );

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${otherSecretToken}` },
    });

    expect(res.status).toBe(401);
  });

  it('userIdを含まないトークンの場合、401になる', async () => {
    const app = await buildApp();
    const tokenWithoutUserId = await createToken({ sub: 'user-1' });

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${tokenWithoutUserId}` },
    });

    expect(res.status).toBe(401);
  });

  it('Authorizationヘッダーでトークンを送った場合は受け付けず、401になる', async () => {
    const app = await buildApp();
    const validToken = await createToken({ sub: 'user-1', userId: 'user-1' });

    const res = await app.request('/', {
      headers: { Authorization: `Bearer ${validToken}` },
    });

    expect(res.status).toBe(401);
  });

  it('有効なトークンなら通過し、userIdがセットされる', async () => {
    const app = await buildApp();
    const validToken = await createToken({ sub: 'user-1', userId: 'user-1' });

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${validToken}` },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: 'user-1' });
  });

  it('認証を通過した後のハンドラーのエラーは、メッセージを書き換えない', async () => {
    const { authMiddleware } = await import('~/server/v2/auth');
    const { errorHandler } = await import('~/server/v2/lib/errorHandler');
    const { HTTPException } = await import('hono/http-exception');
    const app = new Hono()
      .use('*', authMiddleware)
      .get('/', () => {
        throw new HTTPException(401, { message: 'ハンドラー側のエラー' });
      })
      .onError(errorHandler);
    const validToken = await createToken({ sub: 'user-1', userId: 'user-1' });

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${validToken}` },
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: 'ハンドラー側のエラー' });
  });
});

describe('facilityMiddleware', () => {
  beforeEach(() => {
    process.env.SECRET_KEY = TEST_SECRET;
    vi.resetModules();
  });

  async function buildAppWithUserId(userId: string) {
    const { facilityMiddleware } = await import('~/server/v2/auth');
    const nextSpy = vi.fn(async () => {});

    const app = new Hono<{ Variables: Variables }>()
      .use('*', async (c, next) => {
        c.set('userId', userId);
        await next();
      })
      .use('*', async (c, next) => {
        await facilityMiddleware(c, async () => {
          await nextSpy();
          await next();
        });
      })
      .get('/', (c) =>
        c.json({
          facilityCode: c.get('facilityCode'),
          facilityName: c.get('facilityName'),
        }),
      );

    return { app, nextSpy };
  }

  it('facility_codeが見つからない場合は404になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    } as never);

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(404);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('DBクエリが失敗した場合は500になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockRejectedValueOnce(
      new Error('DB接続エラー'),
    );

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(500);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('正常系ではfacilityCode・facilityNameがセットされ、next()が呼ばれる', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ facility_code: 'FAC-001', facility_name: 'テスト病院' }],
    } as never);

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      facilityCode: 'FAC-001',
      facilityName: 'テスト病院',
    });
    expect(nextSpy).toHaveBeenCalledOnce();
  });
});

describe('adminUserOnlyMiddleware', () => {
  beforeEach(() => {
    process.env.SECRET_KEY = TEST_SECRET;
    vi.resetModules();
  });

  async function buildAppWithUserId(userId: string) {
    const { adminUserOnlyMiddleware } = await import('~/server/v2/auth');
    const nextSpy = vi.fn(async () => {});

    const app = new Hono<{ Variables: Variables }>()
      .use('*', async (c, next) => {
        c.set('userId', userId);
        await next();
      })
      .use('*', async (c, next) => {
        await adminUserOnlyMiddleware(c, async () => {
          await nextSpy();
          await next();
        });
      })
      .get('/', (c) => c.json({ userRole: c.get('userRole') }));

    return { app, nextSpy };
  }

  it('ユーザー権限情報が見つからない場合は404になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    } as never);

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(404);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('DBクエリが失敗した場合は500になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockRejectedValueOnce(
      new Error('DB接続エラー'),
    );

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(500);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('user_roleがadmin以外の場合は403になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_role: 'general' }],
    } as never);

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(403);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('正常系ではuserRoleがセットされ、next()が呼ばれる', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_role: 'admin' }],
    } as never);

    const { app, nextSpy } = await buildAppWithUserId('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userRole: 'admin' });
    expect(nextSpy).toHaveBeenCalledOnce();
  });
});
