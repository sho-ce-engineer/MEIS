import { describe, expect, it, vi } from 'vitest';

const deleteMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  targetUserId: 'user-1',
};

describe('deleteUser', () => {
  it('DB正常応答の場合、削除された行を返す', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([{ userId: 'user-1', facilityCode: 'FAC001' }]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteUser } = await import('./service');

    await expect(deleteUser(baseParams)).resolves.toEqual({
      userId: 'user-1',
      facilityCode: 'FAC001',
    });
  });

  it('該当行が無い場合、undefinedを返す', async () => {
    const returningMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteUser } = await import('./service');

    await expect(deleteUser(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteUser } = await import('./service');

    await expect(deleteUser(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
