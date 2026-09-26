import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  page: 1,
  itemsPerPage: 10,
  sortRow: 'reportedDate' as const,
  sortOrder: 'desc' as const,
  filterCriteria: {},
  facilityCode: 'FAC001',
};

function mockListQuery(rows: unknown[]) {
  const offsetMock = vi.fn().mockResolvedValue(rows);
  const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
  const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
  const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  return fromMock;
}

describe('listIssues', () => {
  it('DBから取得した行をitemsとして返し、reportedDateをJST日付文字列に整形する', async () => {
    const listFromMock = mockListQuery([
      {
        issueId: 'FAC001IssueId20260914000000R123456',
        reportedDate: '2026-09-14T00:00:00.000Z',
        reporter: 'reporter-1',
        equipmentId: 'EQ001',
        location: 'loc-1',
        description: 'desc-1',
      },
    ]);
    const totalWhereMock = vi.fn().mockResolvedValue([{ total: 1 }]);
    const totalFromMock = vi.fn().mockReturnValue({ where: totalWhereMock });

    selectMock
      .mockReturnValueOnce({ from: listFromMock })
      .mockReturnValueOnce({ from: totalFromMock });

    const { listIssues } = await import('./service');
    const result = await listIssues(baseParams);

    expect(result.total).toBe(1);
    expect(result.items[0].reportedDate).toBe('2026-09-14');
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const offsetMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { listIssues } = await import('./service');

    await expect(listIssues(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
