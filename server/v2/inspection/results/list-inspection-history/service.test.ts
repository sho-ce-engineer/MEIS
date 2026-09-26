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
  sortRow: 'inspectionDate' as const,
  sortOrder: 'desc' as const,
  filterCriteria: {},
};

function createListChainMock(resolvedRows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(resolvedRows),
  };
}

function createTotalChainMock(total: string) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ total }]),
  };
}

describe('listInspectionHistory', () => {
  it('DBから取得した行をitemsとして返し、inspectionDateをJST日付文字列に整形する', async () => {
    selectMock
      .mockReturnValueOnce(
        createListChainMock([
          {
            equipmentId: 'EQ001',
            equipmentSerialNumber: 'SN001',
            equipmentName: '人工呼吸器',
            equipmentModel: 'MODEL-A',
            equipmentManufacturer: 'MAKER-A',
            inspectionDate: '2026-09-14T00:00:00.000Z',
            userId: 'USER001',
            userName: 'テストユーザー',
            inspectionType: '定期点検',
            inspectionResults: {
              ITEM001: { resultId: 'R001', result: '正常', notes: null },
            },
          },
        ]),
      )
      .mockReturnValueOnce(createTotalChainMock('1'));

    const { listInspectionHistory } = await import('./service');
    const result = await listInspectionHistory(baseParams);

    expect(result.total).toBe(1);
    expect(result.items[0].inspectionDate).toBe('2026-09-14');
    expect(result.items[0].equipmentId).toBe('EQ001');
    expect(result.items[0].inspectionResults).toEqual({
      ITEM001: { resultId: 'R001', result: '正常', notes: null },
    });
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const chain = createListChainMock([]);
    chain.offset = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    selectMock.mockReturnValueOnce(chain);

    const { listInspectionHistory } = await import('./service');

    await expect(listInspectionHistory(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
