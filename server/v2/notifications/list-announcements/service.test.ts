import { describe, expect, it, vi } from 'vitest';

function createListChainMock(resolvedRows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(resolvedRows),
  };
}

function createCountChainMock(total: number) {
  return {
    from: vi.fn().mockResolvedValue([{ total }]),
  };
}

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  page: 1,
  itemsPerPage: 10,
  sortRow: 'created_at' as const,
  sortOrder: 'desc' as const,
  userId: 'user-1',
};

describe('listAnnouncements', () => {
  it('該当データが0件の場合、itemsは空配列、totalはannouncements全体の件数を返す', async () => {
    selectMock
      .mockReturnValueOnce(createListChainMock([]))
      .mockReturnValueOnce(createCountChainMock(5));

    const { listAnnouncements } = await import('./service');
    const result = await listAnnouncements(baseParams);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(5);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockRejectedValue(new Error('DB接続エラー')),
    };
    selectMock.mockReturnValueOnce(chain);

    const { listAnnouncements } = await import('./service');

    await expect(listAnnouncements(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
