import { describe, expect, it, vi } from 'vitest';

const transactionMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  updatedItems: {
    外装点検: [
      { inspection_item_id: 'ITEM-001' },
      { inspection_item_id: 'ITEM-002' },
    ],
    機能点検: [{ inspection_item_id: 'ITEM-003' }],
  },
};

describe('saveSortedInspectionItems', () => {
  it('各アイテムに配列インデックス+1のsort_numberでUPDATEを発行する', async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    const updateMock = vi.fn().mockReturnValue({ set: setMock });
    const tx = { update: updateMock };
    transactionMock.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) => {
        await callback(tx);
      },
    );

    const { saveSortedInspectionItems } = await import('./service');
    await saveSortedInspectionItems(baseParams);

    expect(updateMock).toHaveBeenCalledTimes(3);
    expect(setMock).toHaveBeenNthCalledWith(1, { inspectionSortNumber: 1 });
    expect(setMock).toHaveBeenNthCalledWith(2, { inspectionSortNumber: 2 });
    expect(setMock).toHaveBeenNthCalledWith(3, { inspectionSortNumber: 1 });
  });

  it('トランザクションが失敗した場合、エラーをそのまま伝播する', async () => {
    transactionMock.mockRejectedValue(new Error('DB接続エラー'));

    const { saveSortedInspectionItems } = await import('./service');

    await expect(saveSortedInspectionItems(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
