import { describe, expect, it, vi } from 'vitest';

const transactionMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  baseEquipmentType: 'Diagnostic',
  baseEquipmentModel: 'CT200',
  baseInspectionType: '日常点検',
  targetEquipmentType: 'Diagnostic',
  targetEquipmentModel: 'CT300',
  targetInspectionType: '日常点検',
};

describe('copyInspectionItems', () => {
  it('コピー元の各行を新しいinspection_item_idでINSERTする', async () => {
    const whereMock = vi.fn().mockResolvedValue([
      {
        inspectionItemCategory: '外装点検',
        inspectionItem: 'item-1',
        inspectionItemDescription: 'desc-1',
        inspectionComponentType: 'InspectionCustomCheck',
        inspectionSortNumber: 1,
        min: null,
        max: null,
        suffix: null,
        lowerlimit: null,
        upperlimit: null,
      },
      {
        inspectionItemCategory: '機能点検',
        inspectionItem: 'item-2',
        inspectionItemDescription: 'desc-2',
        inspectionComponentType: 'InspectionCustomNumber',
        inspectionSortNumber: 2,
        min: '0',
        max: '100',
        suffix: null,
        lowerlimit: '10',
        upperlimit: null,
      },
    ]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    const insertMock = vi.fn().mockReturnValue({ values: insertValuesMock });
    const tx = { select: selectMock, insert: insertMock };

    transactionMock.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) => {
        await callback(tx);
      },
    );

    const { copyInspectionItems } = await import('./service');
    await copyInspectionItems(baseParams);

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertValuesMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        inspectionItemCategory: '外装点検',
        equipmentModel: 'CT300',
        inspectionType: '日常点検',
      }),
    );
    expect(insertValuesMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        inspectionItemCategory: '機能点検',
        min: '0',
        max: '100',
      }),
    );
  });

  it('トランザクションが失敗した場合、エラーをそのまま伝播する', async () => {
    transactionMock.mockRejectedValue(new Error('DB接続エラー'));

    const { copyInspectionItems } = await import('./service');

    await expect(copyInspectionItems(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
