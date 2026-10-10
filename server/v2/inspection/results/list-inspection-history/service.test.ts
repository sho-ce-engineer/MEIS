import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';
import { equipmentLedger, inspectionItems, users } from '~/server/db/schema';

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

const dialect = new PgDialect();

function findJoinConditionSql(
  innerJoinMock: ReturnType<typeof vi.fn>,
  table: unknown,
) {
  const call = innerJoinMock.mock.calls.find(([joined]) => joined === table);
  return call ? dialect.sqlToQuery(call[1] as SQL).sql : undefined;
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
    expect(result.items[0]?.inspectionDate).toBe('2026-09-14');
    expect(result.items[0]?.equipmentId).toBe('EQ001');
    expect(result.items[0]?.inspectionResults).toEqual({
      ITEM001: { resultId: 'R001', result: '正常', notes: null },
    });
  });

  describe('JOINの条件に、点検結果と同じ施設コードの条件を含める', () => {
    it.each([
      ['inspection_items', inspectionItems],
      ['equipment_ledger', equipmentLedger],
      ['users', users],
    ])('一覧のクエリ：%s', async (tableName, table) => {
      const listChain = createListChainMock([]);
      selectMock
        .mockReturnValueOnce(listChain)
        .mockReturnValueOnce(createTotalChainMock('0'));

      const { listInspectionHistory } = await import('./service');
      await listInspectionHistory(baseParams);

      expect(findJoinConditionSql(listChain.innerJoin, table)).toContain(
        `"inspection_results"."facility_code" = "${tableName}"."facility_code"`,
      );
    });

    it.each([
      ['inspection_items', inspectionItems],
      ['equipment_ledger', equipmentLedger],
    ])('件数のクエリ：%s', async (tableName, table) => {
      const totalChain = createTotalChainMock('0');
      selectMock
        .mockReturnValueOnce(createListChainMock([]))
        .mockReturnValueOnce(totalChain);

      const { listInspectionHistory } = await import('./service');
      await listInspectionHistory(baseParams);

      expect(findJoinConditionSql(totalChain.innerJoin, table)).toContain(
        `"inspection_results"."facility_code" = "${tableName}"."facility_code"`,
      );
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
