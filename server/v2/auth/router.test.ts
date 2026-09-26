import bcrypt from 'bcrypt';
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET_KEY = 'test-secret-key';
process.env.SECRET_KEY = SECRET_KEY;
process.env.EMAIL_SERVICE_OWNER ??= 'owner@example.com';
process.env.FRONTEND_URL ??= 'http://localhost:3000';

const verifyRecaptchaMock = vi.fn();
const getUserCredentialMock = vi.fn();
const getSessionUserMock = vi.fn();
const getUserByEmailMock = vi.fn();
const getInvitationMock = vi.fn();
const addFacilityMock = vi.fn();
const addUserMock = vi.fn();
const updateInvitationAsUsedMock = vi.fn();
const sendMailMock = vi.fn();

vi.mock('~/server/v2/auth/lib/verifyRecaptcha', () => ({
  verifyRecaptcha: (...args: unknown[]) => verifyRecaptchaMock(...args),
}));

vi.mock('~/server/v2/auth/lib/generateUserId', () => ({
  generateUserId: (facilityCode: string) => `${facilityCode}20260101090000`,
}));

vi.mock('~/server/v2/auth/add-session/service', () => ({
  getUserCredential: (...args: unknown[]) => getUserCredentialMock(...args),
}));

vi.mock('~/server/v2/auth/get-session/service', () => ({
  getSessionUser: (...args: unknown[]) => getSessionUserMock(...args),
}));

vi.mock('~/server/v2/auth/add-user/service', () => ({
  getUserByEmail: (...args: unknown[]) => getUserByEmailMock(...args),
  getInvitation: (...args: unknown[]) => getInvitationMock(...args),
  addFacility: (...args: unknown[]) => addFacilityMock(...args),
  addUser: (...args: unknown[]) => addUserMock(...args),
  updateInvitationAsUsed: (...args: unknown[]) =>
    updateInvitationAsUsedMock(...args),
}));

vi.mock('~/server/mail/send-mail', () => ({
  sendMail: (...args: unknown[]) => sendMailMock(...args),
}));

async function buildApp() {
  const { default: authRouter } = await import('./router');
  return new Hono().route('/auth', authRouter);
}

const postJson = (app: Hono, path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetModules();
  verifyRecaptchaMock.mockReset();
  verifyRecaptchaMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('auth router: POST /session（ログイン）', () => {
  const validBody = {
    email: 'test@test.com',
    password: 'password',
    recaptchaToken: 'recaptcha-token',
  };

  beforeEach(() => {
    getUserCredentialMock.mockReset();
  });

  it('メールアドレスとパスワードが正しい場合、200でuser_idを含む有効期限1時間のトークンを返す', async () => {
    getUserCredentialMock.mockResolvedValue({
      userId: 'FAC00120260101090000',
      password: await bcrypt.hash('password', 4),
    });

    const app = await buildApp();
    const res = await postJson(app, '/auth/session', validBody);

    expect(res.status).toBe(200);
    const { token } = await res.json();
    const payload = await verify(token, SECRET_KEY, 'HS256');
    expect(payload.user_id).toBe('FAC00120260101090000');
    expect(Number(payload.exp) - Number(payload.iat)).toBe(3600);
    expect(getUserCredentialMock).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });

  it('パスワードが違う場合、401になる', async () => {
    getUserCredentialMock.mockResolvedValue({
      userId: 'FAC00120260101090000',
      password: await bcrypt.hash('password', 4),
    });

    const app = await buildApp();
    const res = await postJson(app, '/auth/session', {
      ...validBody,
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  it('メールアドレスのユーザーが存在しない場合、401になる', async () => {
    getUserCredentialMock.mockResolvedValue(undefined);

    const app = await buildApp();
    const res = await postJson(app, '/auth/session', validBody);

    expect(res.status).toBe(401);
  });

  it('reCAPTCHAの検証に失敗した場合、400になりDBは参照しない', async () => {
    verifyRecaptchaMock.mockResolvedValue(false);

    const app = await buildApp();
    const res = await postJson(app, '/auth/session', validBody);

    expect(res.status).toBe(400);
    expect(getUserCredentialMock).not.toHaveBeenCalled();
  });

  it('DBエラーの場合、500になる', async () => {
    getUserCredentialMock.mockRejectedValue(new Error('DB接続エラー'));

    const app = await buildApp();
    const res = await postJson(app, '/auth/session', validBody);

    expect(res.status).toBe(500);
  });

  it('emailが無い場合、400になる', async () => {
    const app = await buildApp();
    const res = await postJson(app, '/auth/session', {
      password: 'password',
      recaptchaToken: 'recaptcha-token',
    });

    expect(res.status).toBe(400);
    expect(getUserCredentialMock).not.toHaveBeenCalled();
  });
});

describe('auth router: GET /session（セッション情報の取得）', () => {
  beforeEach(() => {
    getSessionUserMock.mockReset();
  });

  const bearer = async (
    payload: Record<string, unknown>,
    secret = SECRET_KEY,
  ) => {
    const token = await sign(payload, secret, 'HS256');
    return { Authorization: `Bearer ${token}` };
  };

  it('有効なBearerトークンの場合、200でユーザー情報を返す', async () => {
    getSessionUserMock.mockResolvedValue({
      userId: 'FAC00120260101090000',
      userEmail: 'test@test.com',
      userName: '山田太郎',
      userRole: 'admin',
      facilityCode: 'FAC001',
      facilityName: 'テスト病院',
    });
    const now = Math.floor(Date.now() / 1000);

    const app = await buildApp();
    const res = await app.request('/auth/session', {
      headers: await bearer({ user_id: 'FAC00120260101090000', exp: now + 60 }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      userId: 'FAC00120260101090000',
      email: 'test@test.com',
      name: '山田太郎',
      role: 'admin',
      facilityCode: 'FAC001',
      facilityName: 'テスト病院',
    });
    expect(getSessionUserMock).toHaveBeenCalledWith({
      userId: 'FAC00120260101090000',
    });
  });

  it('Authorizationヘッダーが無い場合、401になる', async () => {
    const app = await buildApp();
    const res = await app.request('/auth/session');

    expect(res.status).toBe(401);
    expect(getSessionUserMock).not.toHaveBeenCalled();
  });

  it('別の秘密鍵で署名されたトークンの場合、401になる', async () => {
    const app = await buildApp();
    const res = await app.request('/auth/session', {
      headers: await bearer({ user_id: 'FAC001' }, 'attacker-secret'),
    });

    expect(res.status).toBe(401);
    expect(getSessionUserMock).not.toHaveBeenCalled();
  });

  it('期限切れのトークンの場合、401になる', async () => {
    const now = Math.floor(Date.now() / 1000);

    const app = await buildApp();
    const res = await app.request('/auth/session', {
      headers: await bearer({ user_id: 'FAC001', exp: now - 60 }),
    });

    expect(res.status).toBe(401);
  });

  it('ユーザーが存在しない場合、404になる', async () => {
    getSessionUserMock.mockResolvedValue(undefined);

    const app = await buildApp();
    const res = await app.request('/auth/session', {
      headers: await bearer({ user_id: 'deleted-user' }),
    });

    expect(res.status).toBe(404);
  });
});

describe('auth router: DELETE /session（ログアウト）', () => {
  it('v1と同じく、200で固定のメッセージを返す', async () => {
    const app = await buildApp();
    const res = await app.request('/auth/session', { method: 'DELETE' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'logout successfully' });
  });
});

describe('auth router: POST /users（新規登録）', () => {
  const baseBody = {
    email: 'new@test.com',
    password: 'password',
    userName: '山田太郎',
    recaptchaToken: 'recaptcha-token',
  };

  const createdUser = (facilityCode: string, userRole: string) => ({
    userId: `${facilityCode}20260101090000`,
    userEmail: 'new@test.com',
    userName: '山田太郎',
    facilityCode,
    userRole,
  });

  const validInvitation = {
    email: 'new@test.com',
    facilityCode: 'FAC001',
    userRole: 'general',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    facilityName: 'テスト病院',
  };

  beforeEach(() => {
    getUserByEmailMock.mockReset();
    getInvitationMock.mockReset();
    addFacilityMock.mockReset();
    addUserMock.mockReset();
    updateInvitationAsUsedMock.mockReset();
    sendMailMock.mockReset();
    getUserByEmailMock.mockResolvedValue(undefined);
    addFacilityMock.mockResolvedValue(undefined);
    updateInvitationAsUsedMock.mockResolvedValue(undefined);
    sendMailMock.mockResolvedValue(undefined);
  });

  describe('招待コードなし（新しい施設を作成する）', () => {
    const body = { ...baseBody, facilityName: 'てすと' };

    it('施設を作成し、adminとして登録して200で登録結果を返す。登録者と管理者の2通のメールを送る', async () => {
      addUserMock.mockResolvedValue(createdUser('facilitytesuto', 'admin'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        data: {
          message: 'アカウントが作成されました',
          user: {
            userId: 'facilitytesuto20260101090000',
            email: 'new@test.com',
            name: '山田太郎',
            facilityCode: 'facilitytesuto',
            role: 'admin',
          },
        },
      });
      expect(addFacilityMock).toHaveBeenCalledWith({
        facilityCode: 'facilitytesuto',
        facilityName: 'てすと',
      });
      expect(addUserMock).toHaveBeenCalledWith({
        userId: 'facilitytesuto20260101090000',
        userEmail: 'new@test.com',
        password: 'password',
        userName: '山田太郎',
        facilityCode: 'facilitytesuto',
        userRole: 'admin',
      });
      expect(getInvitationMock).not.toHaveBeenCalled();
      expect(updateInvitationAsUsedMock).not.toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenCalledTimes(2);
      expect(sendMailMock).toHaveBeenNthCalledWith(
        1,
        'new@test.com',
        'クラウド医療機器管理M.E.I.S｜ユーザー登録が完了しました！',
        expect.stringContaining('山田太郎'),
        expect.stringContaining('山田太郎'),
      );
      expect(sendMailMock).toHaveBeenNthCalledWith(
        2,
        process.env.EMAIL_SERVICE_OWNER,
        'M.E.I.Sに新規ユーザーが登録されました',
        expect.stringContaining('てすと'),
        expect.stringContaining('てすと'),
      );
    });

    it('施設名が無い場合、400になり何も登録しない', async () => {
      const app = await buildApp();
      const res = await postJson(app, '/auth/users', baseBody);

      expect(res.status).toBe(400);
      expect(addFacilityMock).not.toHaveBeenCalled();
      expect(addUserMock).not.toHaveBeenCalled();
    });

    it('施設の作成でDBエラーの場合、500になりユーザーは登録しない', async () => {
      addFacilityMock.mockRejectedValue(new Error('DB接続エラー'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(500);
      expect(addUserMock).not.toHaveBeenCalled();
    });
  });

  describe('招待コードあり', () => {
    const body = { ...baseBody, inviteCode: 'invite-code-1' };

    it('招待の施設・ロールで登録し、招待コードを使用済みにして200を返す。施設は作成しない', async () => {
      getInvitationMock.mockResolvedValue(validInvitation);
      addUserMock.mockResolvedValue(createdUser('FAC001', 'general'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(200);
      expect(getInvitationMock).toHaveBeenCalledWith({
        inviteCode: 'invite-code-1',
      });
      expect(addUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'FAC00120260101090000',
          facilityCode: 'FAC001',
          userRole: 'general',
        }),
      );
      expect(updateInvitationAsUsedMock).toHaveBeenCalledWith({
        inviteCode: 'invite-code-1',
      });
      expect(addFacilityMock).not.toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenNthCalledWith(
        2,
        process.env.EMAIL_SERVICE_OWNER,
        expect.any(String),
        expect.stringContaining('テスト病院'),
        expect.stringContaining('テスト病院'),
      );
    });

    it('招待コードが存在しない場合、404になり登録しない', async () => {
      getInvitationMock.mockResolvedValue(undefined);

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(404);
      expect(addUserMock).not.toHaveBeenCalled();
    });

    it('招待の有効期限が切れている場合、400になり登録しない', async () => {
      getInvitationMock.mockResolvedValue({
        ...validInvitation,
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      });

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(400);
      expect(addUserMock).not.toHaveBeenCalled();
    });

    it('招待の有効期限がnullの場合、期限切れとして400になる', async () => {
      getInvitationMock.mockResolvedValue({
        ...validInvitation,
        expiresAt: null,
      });

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(400);
      expect(addUserMock).not.toHaveBeenCalled();
    });

    it('招待先のメールアドレスと一致しない場合、400になり登録しない', async () => {
      getInvitationMock.mockResolvedValue({
        ...validInvitation,
        email: 'someone-else@test.com',
      });

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(400);
      expect(addUserMock).not.toHaveBeenCalled();
    });

    it('招待コードの使用済み更新でDBエラーの場合、500になる', async () => {
      getInvitationMock.mockResolvedValue(validInvitation);
      addUserMock.mockResolvedValue(createdUser('FAC001', 'general'));
      updateInvitationAsUsedMock.mockRejectedValue(new Error('DB接続エラー'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(500);
      expect(sendMailMock).not.toHaveBeenCalled();
    });
  });

  describe('共通の異常系', () => {
    const body = { ...baseBody, facilityName: 'てすと' };

    it('同じメールアドレスのユーザーがいる場合、400になり登録しない', async () => {
      getUserByEmailMock.mockResolvedValue({ userId: 'existing-user' });

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(400);
      expect(addUserMock).not.toHaveBeenCalled();
    });

    it('reCAPTCHAの検証に失敗した場合、400になりDBは参照しない', async () => {
      verifyRecaptchaMock.mockResolvedValue(false);

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(400);
      expect(getUserByEmailMock).not.toHaveBeenCalled();
    });

    it('reCAPTCHAの検証自体でエラーが起きた場合、500になる', async () => {
      verifyRecaptchaMock.mockRejectedValue(new Error('network error'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(500);
      expect(getUserByEmailMock).not.toHaveBeenCalled();
    });

    it('ユーザーの登録でDBエラーの場合、500になりメールは送らない', async () => {
      addUserMock.mockRejectedValue(new Error('DB接続エラー'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(500);
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('メール送信に失敗しても、v1と同じく登録は成功として200を返す', async () => {
      addUserMock.mockResolvedValue(createdUser('facilitytesuto', 'admin'));
      sendMailMock.mockRejectedValue(new Error('メール送信エラー'));

      const app = await buildApp();
      const res = await postJson(app, '/auth/users', body);

      expect(res.status).toBe(200);
      expect(sendMailMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['email', { password: 'password', userName: '山田太郎' }],
      ['password', { email: 'new@test.com', userName: '山田太郎' }],
      ['userName', { email: 'new@test.com', password: 'password' }],
    ])('%sが無い場合、400になり何もしない', async (_, partial) => {
      const app = await buildApp();
      const res = await postJson(app, '/auth/users', {
        ...partial,
        facilityName: 'てすと',
        recaptchaToken: 'recaptcha-token',
      });

      expect(res.status).toBe(400);
      expect(verifyRecaptchaMock).not.toHaveBeenCalled();
      expect(addUserMock).not.toHaveBeenCalled();
    });
  });
});
