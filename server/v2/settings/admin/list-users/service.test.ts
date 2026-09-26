import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  page: 1,
  itemsPerPage: 10,
  sortRow: 'userName' as const,
  sortOrder: 'asc' as const,
};

function mockListQuery(rows: unknown[]) {
  const offsetMock = vi.fn().mockResolvedValue(rows);
  const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
  const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
  const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  return fromMock;
}

describe('listUsers', () => {
  it('DBから取得した行をitemsとして返し、totalを数値で返す', async () => {
    const listFromMock = mockListQuery([
      { userId: 'user-1', userName: '山田太郎', userRole: 'admin' },
    ]);
    const totalWhereMock = vi.fn().mockResolvedValue([{ total: 1 }]);
    const totalFromMock = vi.fn().mockReturnValue({ where: totalWhereMock });

    selectMock
      .mockReturnValueOnce({ from: listFromMock })
      .mockReturnValueOnce({ from: totalFromMock });

    const { listUsers } = await import('./service');
    const result = await listUsers(baseParams);

    expect(result.total).toBe(1);
    expect(result.items).toEqual([
      { userId: 'user-1', userName: '山田太郎', userRole: 'admin' },
    ]);
  });

  it('該当ユーザーが無い場合、空配列とtotal 0を返す', async () => {
    const listFromMock = mockListQuery([]);
    const totalWhereMock = vi.fn().mockResolvedValue([{ total: 0 }]);
    const totalFromMock = vi.fn().mockReturnValue({ where: totalWhereMock });

    selectMock
      .mockReturnValueOnce({ from: listFromMock })
      .mockReturnValueOnce({ from: totalFromMock });

    const { listUsers } = await import('./service');
    const result = await listUsers(baseParams);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const offsetMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });

    selectMock.mockReturnValueOnce({ from: fromMock });

    const { listUsers } = await import('./service');

    await expect(listUsers(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
