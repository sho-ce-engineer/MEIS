import { describe, expect, it, vi } from 'vitest';

const updateMock = vi.fn();
const insertMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    update: (...args: unknown[]) => updateMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

const baseParams = {
  userId: 'user-1',
  announcementId: '1',
  isViewed: true,
};

describe('markAsRead', () => {
  it('UPDATEが1件以上ヒットした場合、INSERTは呼ばれない', async () => {
    const returningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { markAsRead } = await import('./service');
    await markAsRead(baseParams);

    expect(insertMock).not.toHaveBeenCalled();
  });

  it('UPDATEが0件だった場合、INSERTが呼ばれる', async () => {
    const returningMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    const { markAsRead } = await import('./service');
    await markAsRead(baseParams);

    expect(insertMock).toHaveBeenCalledOnce();
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        announcementId: 1,
        isViewed: true,
      }),
    );
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { markAsRead } = await import('./service');

    await expect(markAsRead(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
