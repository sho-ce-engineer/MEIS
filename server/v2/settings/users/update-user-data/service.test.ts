import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateMock = vi.fn();
const hashMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: (...args: unknown[]) => hashMock(...args),
  },
}));

const baseParams = {
  userId: 'user-1',
  facilityCode: 'FAC001',
  userName: '山田太郎',
  userEmail: 'yamada@example.com',
};

describe('updateUserData', () => {
  beforeEach(() => {
    vi.resetModules();
    updateMock.mockReset();
    hashMock.mockReset();
  });

  it('passwordを指定した場合、ハッシュ化してSET句に含める', async () => {
    hashMock.mockResolvedValue('hashed-password');
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { userName: '山田太郎', userEmail: 'yamada@example.com' },
      ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserData } = await import('./service');

    await expect(
      updateUserData({ ...baseParams, password: 'newpassword' }),
    ).resolves.toEqual({
      userName: '山田太郎',
      userEmail: 'yamada@example.com',
    });

    expect(hashMock).toHaveBeenCalledWith('newpassword', 10);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-password' }),
    );
  });

  it('passwordを指定しない場合、SET句にpasswordを含めない', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { userName: '山田太郎', userEmail: 'yamada@example.com' },
      ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserData } = await import('./service');

    await updateUserData(baseParams);

    expect(hashMock).not.toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ password: undefined }),
    );
  });

  it('該当行が無い場合、undefinedを返す', async () => {
    const returningMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserData } = await import('./service');

    await expect(updateUserData(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserData } = await import('./service');

    await expect(updateUserData(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
