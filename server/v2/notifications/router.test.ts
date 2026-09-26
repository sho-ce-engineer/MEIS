import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Variables } from '~/server/v2/auth';

const getUnreadCountMock = vi.fn();
const listAnnouncementsMock = vi.fn();
const markAsReadMock = vi.fn();

vi.mock('~/server/v2/notifications/get-unread-count/service', () => ({
  getUnreadCount: (...args: unknown[]) => getUnreadCountMock(...args),
}));

vi.mock('~/server/v2/notifications/list-announcements/service', () => ({
  listAnnouncements: (...args: unknown[]) => listAnnouncementsMock(...args),
}));

vi.mock('~/server/v2/notifications/mark-as-read/service', () => ({
  markAsRead: (...args: unknown[]) => markAsReadMock(...args),
}));

async function buildAppWithJwtPayload(userId: string) {
  const { default: notificationsRouter } = await import('./router');

  const app = new Hono<{ Variables: Variables }>()
    .use('*', async (c, next) => {
      c.set('jwtPayload', { user_id: userId });
      await next();
    })
    .route('/notifications', notificationsRouter);

  return app;
}

describe('notifications router: /unread-count', () => {
  beforeEach(() => {
    vi.resetModules();
    getUnreadCountMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・DB正常応答の場合、200でunreadCountを返す', async () => {
    getUnreadCountMock.mockResolvedValue(3);

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/unread-count');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ unreadCount: 3 });
    expect(getUnreadCountMock).toHaveBeenCalledWith('user-1');
  });

  it('認証済み・DBエラーの場合、500になる', async () => {
    getUnreadCountMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/unread-count');

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: notificationsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/notifications', notificationsRouter);

    const res = await app.request('/notifications/unread-count');

    expect(res.status).toBe(401);
    expect(getUnreadCountMock).not.toHaveBeenCalled();
  });
});

describe('notifications router: /announcements', () => {
  const validBody = {
    page: 1,
    itemsPerPage: 10,
    sortRow: 'createdAt',
    sortOrder: 'desc',
  };

  beforeEach(() => {
    vi.resetModules();
    listAnnouncementsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200でlistAnnouncementsの結果を返す', async () => {
    listAnnouncementsMock.mockResolvedValue({ items: [], total: 0 });

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], total: 0 });
  });

  it('itemsPerPageに100を超える値（一覧の「All」）を指定した場合も、200で結果を返す', async () => {
    listAnnouncementsMock.mockResolvedValue({ items: [], total: 0 });

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, itemsPerPage: 999999 }),
    });

    expect(res.status).toBe(200);
    expect(listAnnouncementsMock).toHaveBeenCalledWith(
      expect.objectContaining({ itemsPerPage: 999999 }),
    );
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    listAnnouncementsMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: notificationsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/notifications', notificationsRouter);

    const res = await app.request('/notifications/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(listAnnouncementsMock).not.toHaveBeenCalled();
  });

  it('不正なsortRowを送ると400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, sortRow: 'not-a-valid-column' }),
    });

    expect(res.status).toBe(400);
    expect(listAnnouncementsMock).not.toHaveBeenCalled();
  });
});

describe('notifications router: /already-read', () => {
  const validBody = {
    isViewed: true,
    notificationId: 1,
  };

  beforeEach(() => {
    vi.resetModules();
    markAsReadMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済み・バリデーション成功・DB正常応答の場合、200で{success: true}を返す', async () => {
    markAsReadMock.mockResolvedValue(undefined);

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/already-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(markAsReadMock).toHaveBeenCalledWith({
      userId: 'user-1',
      announcementId: 1,
      isViewed: true,
    });
  });

  it('認証済み・バリデーション成功・DBエラーの場合、500になる', async () => {
    markAsReadMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/already-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(500);
  });

  it('未認証の場合、401になる（authMiddlewareとの配線確認）', async () => {
    process.env.SECRET_KEY = 'test-secret-key';

    const { authMiddleware } = await import('~/server/v2/auth');
    const { default: notificationsRouter } = await import('./router');

    const app = new Hono<{ Variables: Variables }>()
      .use('*', authMiddleware)
      .route('/notifications', notificationsRouter);

    const res = await app.request('/notifications/already-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
    expect(markAsReadMock).not.toHaveBeenCalled();
  });

  it('notificationIdが数値でない場合、400になる（zValidatorの配線確認）', async () => {
    const app = await buildAppWithJwtPayload('user-1');
    const res = await app.request('/notifications/already-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, notificationId: '1' }),
    });

    expect(res.status).toBe(400);
    expect(markAsReadMock).not.toHaveBeenCalled();
  });
});
