import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyRecaptcha } from './verifyRecaptcha';

const fetchMock = vi.fn();

describe('verifyRecaptcha', () => {
  const originalSecret = process.env.RECAPTCHA_SECRET_KEY;

  beforeEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-secret';
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.RECAPTCHA_SECRET_KEY;
    } else {
      process.env.RECAPTCHA_SECRET_KEY = originalSecret;
    }
    vi.unstubAllGlobals();
  });

  it('Googleの検証APIがsuccess: trueを返した場合、trueを返す', async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });

    await expect(verifyRecaptcha('token')).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.google.com/recaptcha/api/siteverify');
    expect(String(init.body)).toBe(
      'secret=test-recaptcha-secret&response=token',
    );
  });

  it('Googleの検証APIがsuccess: falseを返した場合、falseを返す', async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: false }) });

    await expect(verifyRecaptcha('token')).resolves.toBe(false);
  });

  it('RECAPTCHA_SECRET_KEYが未設定の場合、エラーを投げて検証APIを呼ばない', async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;

    await expect(verifyRecaptcha('token')).rejects.toThrow(
      'RECAPTCHA_SECRET_KEY is not configured',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
