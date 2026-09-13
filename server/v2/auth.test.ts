import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { sign } from 'hono/utils/jwt/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const TEST_SECRET = 'test-secret-key';

vi.mock('~/server/config/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

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

  it('トークンが存在しないと401になる', async () => {
    const { authMiddleware } = await import('~/server/v2/auth');
    const app = new Hono().use('*', authMiddleware).get('/', (c) => c.text('ok'));

    const res = await app.request('/');

    expect(res.status).toBe(401);
  });

  it('不正なトークンだと401になる', async () => {
    const { authMiddleware } = await import('~/server/v2/auth');
    const app = new Hono().use('*', authMiddleware).get('/', (c) => c.text('ok'));

    const res = await app.request('/', {
      headers: { Cookie: 'auth.token=invalid-token' },
    });

    expect(res.status).toBe(401);
  });

  it('期限切れのトークンだと401になる', async () => {
    const { authMiddleware } = await import('~/server/v2/auth');
    const app = new Hono().use('*', authMiddleware).get('/', (c) => c.text('ok'));

    const expiredToken = await sign(
      { user_id: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 },
      TEST_SECRET,
      'HS256',
    );

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${expiredToken}` },
    });

    expect(res.status).toBe(401);
  });

  it('有効なトークンなら通過し、jwtPayloadがセットされる', async () => {
    const { authMiddleware } = await import('~/server/v2/auth');
    const app = new Hono<{ Variables: JwtVariables<{ user_id: string }> }>()
      .use('*', authMiddleware)
      .get('/', (c) => {
        const payload = c.get('jwtPayload');
        return c.json({ user_id: payload.user_id });
      });

    const validToken = await sign(
      { user_id: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 },
      TEST_SECRET,
      'HS256',
    );

    const res = await app.request('/', {
      headers: { Cookie: `auth.token=${validToken}` },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user_id: 'user-1' });
  });
});

describe('facilityMiddleware', () => {
  beforeEach(() => {
    process.env.SECRET_KEY = TEST_SECRET;
    vi.resetModules();
  });

  async function buildAppWithJwtPayload(userId: string) {
    const { facilityMiddleware } = await import('~/server/v2/auth');
    const nextSpy = vi.fn(async () => {});

    const app = new Hono<{ Variables: Variables }>()
      .use('*', async (c, next) => {
        c.set('jwtPayload', { user_id: userId });
        await next();
      })
      .use('*', async (c, next) => {
        await facilityMiddleware(c, async () => {
          await nextSpy();
          await next();
        });
      })
      .get('/', (c) => c.json({ facilityCode: c.get('facilityCode') }));

    return { app, nextSpy };
  }

  it('facility_codeが見つからない場合は404になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    } as never);

    const { app, nextSpy } = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(404);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('DBクエリが失敗した場合は500になり、next()が呼ばれない', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockRejectedValueOnce(
      new Error('DB接続エラー'),
    );

    const { app, nextSpy } = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(500);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('正常系ではfacilityCodeがセットされ、next()が呼ばれる', async () => {
    const dbModule = await import('~/server/config/db');
    vi.mocked(dbModule.default.query).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ facility_code: 'FAC-001' }],
    } as never);

    const { app, nextSpy } = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ facilityCode: 'FAC-001' });
    expect(nextSpy).toHaveBeenCalledOnce();
  });
});
