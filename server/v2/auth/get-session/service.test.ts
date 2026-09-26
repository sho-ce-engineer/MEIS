import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const mockSelectResult = (result: Promise<unknown>) => {
  const whereMock = vi.fn().mockReturnValue(result);
  const leftJoinMock = vi.fn().mockReturnValue({ where: whereMock });
  const fromMock = vi.fn().mockReturnValue({ leftJoin: leftJoinMock });
  selectMock.mockReturnValue({ from: fromMock });
};

describe('getSessionUser', () => {
  it('該当ユーザーがいる場合、施設名を含むユーザー情報を返す', async () => {
    const row = {
      userId: 'FAC00120260101090000',
      userEmail: 'test@test.com',
      userName: '山田太郎',
      userRole: 'admin',
      facilityCode: 'FAC001',
      facilityName: 'テスト病院',
    };
    mockSelectResult(Promise.resolve([row]));

    const { getSessionUser } = await import('./service');
    const result = await getSessionUser({ userId: 'FAC00120260101090000' });

    expect(result).toEqual(row);
  });

  it('該当ユーザーがいない場合、undefinedを返す', async () => {
    mockSelectResult(Promise.resolve([]));

    const { getSessionUser } = await import('./service');
    const result = await getSessionUser({ userId: 'unknown' });

    expect(result).toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    mockSelectResult(Promise.reject(new Error('DB接続エラー')));

    const { getSessionUser } = await import('./service');

    await expect(getSessionUser({ userId: 'user-1' })).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
