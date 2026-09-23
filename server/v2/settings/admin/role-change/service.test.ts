import { describe, expect, it, vi } from 'vitest';

const updateMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

const baseParams = {
  targetUserId: 'user-1',
  newUserRole: 'admin',
  facilityCode: 'FAC001',
};

describe('updateUserRole', () => {
  it('DB正常応答の場合、更新後の行を返す', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([{ userId: 'user-1', userRole: 'admin' }]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserRole } = await import('./service');

    await expect(updateUserRole(baseParams)).resolves.toEqual({
      userId: 'user-1',
      userRole: 'admin',
    });
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userRole: 'admin',
        updatedAt: expect.anything(),
      }),
    );
  });

  it('該当行が無い場合、undefinedを返す', async () => {
    const returningMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserRole } = await import('./service');

    await expect(updateUserRole(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateUserRole } = await import('./service');

    await expect(updateUserRole(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
