import bcrypt from 'bcrypt';
import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.SECRET_KEY = 'test-secret-key';

const verifyRecaptchaMock = vi.fn();
const getUserCredentialMock = vi.fn();
const getSessionUserMock = vi.fn();

vi.mock('~/server/v2/auth/lib/verifyRecaptcha', () => ({
  verifyRecaptcha: (...args: unknown[]) => verifyRecaptchaMock(...args),
}));

vi.mock('~/server/v2/auth/add-session/service', () => ({
  getUserCredential: (...args: unknown[]) => getUserCredentialMock(...args),
}));

vi.mock('~/server/v2/auth/get-session/service', () => ({
  getSessionUser: (...args: unknown[]) => getSessionUserMock(...args),
}));

type Authorize = (
  credentials: Record<string, string> | undefined,
) => Promise<User | null>;

const loadAuthOptions = async () => {
  const { authOptions } = await import('./authOptions');
  return authOptions;
};

const loadAuthorize = async () => {
  const authOptions = await loadAuthOptions();
  const [provider] = authOptions.providers;
  return (provider as unknown as { options: { authorize: Authorize } }).options
    .authorize;
};

beforeEach(() => {
  vi.resetModules();
  verifyRecaptchaMock.mockReset();
  getUserCredentialMock.mockReset();
  getSessionUserMock.mockReset();
  verifyRecaptchaMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('authOptions: 設定値', () => {
  it('SECRET_KEYが設定されていないとモジュール読み込み時にエラーになる', async () => {
    vi.stubEnv('SECRET_KEY', '');

    await expect(import('./authOptions')).rejects.toThrow(
      'SECRET_KEY is not configured',
    );
  });

  it('セッションとトークンの有効期限は1時間', async () => {
    const authOptions = await loadAuthOptions();

    expect(authOptions.session?.maxAge).toBe(3600);
    expect(authOptions.jwt?.maxAge).toBe(3600);
  });

  it('セッションCookieはauth.tokenで、HttpOnly・SameSite=Strict・Path=/', async () => {
    const authOptions = await loadAuthOptions();

    expect(authOptions.cookies?.sessionToken).toEqual({
      name: 'auth.token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: false,
      },
    });
  });

  it('本番環境ではセッションCookieにSecureを付ける', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const authOptions = await loadAuthOptions();

    expect(authOptions.cookies?.sessionToken?.options.secure).toBe(true);
  });
});

describe('authOptions: authorize（ログイン時の本人確認）', () => {
  const validCredentials = {
    email: 'test@test.com',
    password: 'password',
    recaptchaToken: 'recaptcha-token',
  };

  it('メールアドレスとパスワードが正しい場合、userIdをidとして返す', async () => {
    getUserCredentialMock.mockResolvedValue({
      userId: 'USER001',
      password: await bcrypt.hash('password', 4),
    });
    const authorize = await loadAuthorize();

    const result = await authorize(validCredentials);

    expect(result).toEqual({ id: 'USER001' });
    expect(verifyRecaptchaMock).toHaveBeenCalledWith('recaptcha-token');
    expect(getUserCredentialMock).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });

  it('パスワードが違う場合、nullを返す', async () => {
    getUserCredentialMock.mockResolvedValue({
      userId: 'USER001',
      password: await bcrypt.hash('another-password', 4),
    });
    const authorize = await loadAuthorize();

    const result = await authorize(validCredentials);

    expect(result).toBeNull();
  });

  it('メールアドレスのユーザーが存在しない場合、nullを返す', async () => {
    getUserCredentialMock.mockResolvedValue(undefined);
    const authorize = await loadAuthorize();

    const result = await authorize(validCredentials);

    expect(result).toBeNull();
  });

  it('入力に不足がある場合、nullを返し、reCAPTCHAもDBも参照しない', async () => {
    const authorize = await loadAuthorize();

    const result = await authorize({
      password: 'password',
      recaptchaToken: 'recaptcha-token',
    });

    expect(result).toBeNull();
    expect(verifyRecaptchaMock).not.toHaveBeenCalled();
    expect(getUserCredentialMock).not.toHaveBeenCalled();
  });

  it('reCAPTCHAの検証に失敗した場合、「reCAPTCHA検証に失敗しました。」のエラーになり、DBは参照しない', async () => {
    verifyRecaptchaMock.mockResolvedValue(false);
    const authorize = await loadAuthorize();

    await expect(authorize(validCredentials)).rejects.toThrow(
      'reCAPTCHA検証に失敗しました。',
    );
    expect(getUserCredentialMock).not.toHaveBeenCalled();
  });

  it('reCAPTCHAの検証自体でエラーが起きた場合、「サーバー設定エラー」のエラーになる', async () => {
    verifyRecaptchaMock.mockRejectedValue(
      new Error('[auth] RECAPTCHA_SECRET_KEY is not configured'),
    );
    const authorize = await loadAuthorize();

    await expect(authorize(validCredentials)).rejects.toThrow(
      'サーバー設定エラー',
    );
  });

  it('DBエラーの場合、「サーバーエラーが発生しました。」のエラーになる', async () => {
    getUserCredentialMock.mockRejectedValue(new Error('DB接続エラー'));
    const authorize = await loadAuthorize();

    await expect(authorize(validCredentials)).rejects.toThrow(
      'サーバーエラーが発生しました。',
    );
  });
});

describe('authOptions: jwt callback（トークンの中身）', () => {
  it('ログイン時は、トークンの中身をsubとuserIdだけにする', async () => {
    const authOptions = await loadAuthOptions();

    const token = await authOptions.callbacks?.jwt?.({
      token: { name: '山田太郎', email: 'test@test.com', sub: 'USER001' },
      user: { id: 'USER001' },
    } as Parameters<NonNullable<typeof authOptions.callbacks.jwt>>[0]);

    expect(token).toEqual({ sub: 'USER001', userId: 'USER001' });
  });

  it('ログイン後のリクエストでは、トークンをそのまま返す', async () => {
    const authOptions = await loadAuthOptions();
    const currentToken: JWT = { sub: 'USER001', userId: 'USER001' };

    const token = await authOptions.callbacks?.jwt?.({
      token: currentToken,
    } as Parameters<NonNullable<typeof authOptions.callbacks.jwt>>[0]);

    expect(token).toBe(currentToken);
  });
});

describe('authOptions: session callback（画面に渡すセッション情報）', () => {
  const session = { expires: '2026-01-01T01:00:00.000Z' } as Session;

  const callSession = async (token: JWT) => {
    const authOptions = await loadAuthOptions();
    return authOptions.callbacks?.session?.({
      session,
      token,
    } as Parameters<NonNullable<typeof authOptions.callbacks.session>>[0]);
  };

  it('トークンのuserIdでユーザーを取得し、SessionDataの形で返す', async () => {
    getSessionUserMock.mockResolvedValue({
      userId: 'USER001',
      userEmail: 'test@test.com',
      userName: '山田太郎',
      userRole: 'admin',
      facilityCode: 'FAC001',
      facilityName: 'テスト病院',
    });

    const result = await callSession({ sub: 'USER001', userId: 'USER001' });

    expect(getSessionUserMock).toHaveBeenCalledWith({ userId: 'USER001' });
    expect(result).toEqual({
      expires: '2026-01-01T01:00:00.000Z',
      userId: 'USER001',
      email: 'test@test.com',
      name: '山田太郎',
      role: 'admin',
      facilityCode: 'FAC001',
      facilityName: 'テスト病院',
    });
  });

  it('トークンにuserIdが無い場合、エラーになりDBは参照しない', async () => {
    await expect(callSession({ sub: 'USER001' })).rejects.toThrow(
      'userId is missing in token',
    );
    expect(getSessionUserMock).not.toHaveBeenCalled();
  });

  it('ユーザーが存在しない場合、エラーになる', async () => {
    getSessionUserMock.mockResolvedValue(undefined);

    await expect(
      callSession({ sub: 'USER001', userId: 'USER001' }),
    ).rejects.toThrow('user not found');
  });
});
