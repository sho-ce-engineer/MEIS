import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const mockSelectResult = (result: Promise<unknown>) => {
  const whereMock = vi.fn().mockReturnValue(result);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  selectMock.mockReturnValue({ from: fromMock });
};

describe('getUserCredential', () => {
  it('該当ユーザーがいる場合、userIdとパスワードハッシュを返す', async () => {
    mockSelectResult(
      Promise.resolve([{ userId: 'FAC00120260101090000', password: 'hash' }]),
    );

    const { getUserCredential } = await import('./service');
    const result = await getUserCredential({ email: 'test@test.com' });

    expect(result).toEqual({
      userId: 'FAC00120260101090000',
      password: 'hash',
    });
  });

  it('該当ユーザーがいない場合、undefinedを返す', async () => {
    mockSelectResult(Promise.resolve([]));

    const { getUserCredential } = await import('./service');
    const result = await getUserCredential({ email: 'nobody@test.com' });

    expect(result).toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    mockSelectResult(Promise.reject(new Error('DB接続エラー')));

    const { getUserCredential } = await import('./service');

    await expect(getUserCredential({ email: 'test@test.com' })).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
